export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-GGNH5MML6K';

const GA_SCRIPT_ID = 'oro-google-analytics';
const LANDING_TIME_KEY = 'oro_analytics_landing_time';
const FIRST_CTA_KEY = 'oro_analytics_first_cta_tracked';

const SOCIAL_HOST_PLATFORMS = [
  { platform: 'instagram', hostPattern: /(^|\.)instagram\.com$/i },
  { platform: 'tiktok', hostPattern: /(^|\.)tiktok\.com$/i },
  { platform: 'linkedin', hostPattern: /(^|\.)linkedin\.com$/i },
  { platform: 'linktree', hostPattern: /(^|\.)linktr\.ee$/i },
];

let configured = false;
let gtagBooted = false;

function canUseBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function ensureGtag() {
  if (!canUseBrowser() || !GA_MEASUREMENT_ID) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!gtagBooted) {
    window.gtag('js', new Date());
    gtagBooted = true;
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  return true;
}

function getLandingTime() {
  if (!canUseBrowser()) return Date.now();

  const stored = sessionStorage.getItem(LANDING_TIME_KEY);
  if (stored) return Number(stored);

  const landingTime = Math.round(performance.timeOrigin || Date.now());
  sessionStorage.setItem(LANDING_TIME_KEY, String(landingTime));
  return landingTime;
}

export function getSocialPlatform(url) {
  if (!canUseBrowser()) return null;

  const destination = new URL(url, window.location.href);
  const match = SOCIAL_HOST_PLATFORMS.find(({ hostPattern }) => hostPattern.test(destination.hostname));
  return match?.platform || null;
}

export function initAnalytics() {
  if (!hasAnalyticsConsent() || !ensureGtag()) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });
  configured = true;
}

export function trackEvent(eventName, params = {}) {
  if (!hasAnalyticsConsent()) return;
  if (!configured) initAnalytics();
  if (!window.gtag) return;

  window.gtag('event', eventName, params);
}

export function trackCtaClick(eventName, params = {}) {
  if (!hasAnalyticsConsent()) return;

  const landingTime = getLandingTime();
  const timeFromLandingMs = Math.max(0, Date.now() - landingTime);
  const isFirstCtaClick = canUseBrowser() && sessionStorage.getItem(FIRST_CTA_KEY) !== 'true';
  const ctaParams = {
    ...params,
    time_from_landing_ms: timeFromLandingMs,
    is_first_cta_click: isFirstCtaClick,
  };

  trackEvent(eventName, ctaParams);

  if (isFirstCtaClick) {
    sessionStorage.setItem(FIRST_CTA_KEY, 'true');
    trackEvent('first_cta_click', {
      cta_event_name: eventName,
      ...ctaParams,
    });
  }
}

export function trackPageView(params = {}) {
  getLandingTime();

  const pagePath = params.page_path || `${window.location.pathname}${window.location.search}${window.location.hash}`;

  trackEvent('page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath,
    ...params,
  });
}

export function trackSocialLinkClick(params = {}) {
  const platform = params.platform || getSocialPlatform(params.destination_url);
  if (!platform) return;

  trackEvent('external_social_link_click', {
    ...params,
    platform,
  });
}

export function trackPageNavigation(params = {}) {
  trackEvent('page_navigation', {
    from_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    transport_type: 'beacon',
    ...params,
  });
}

export function hasAnalyticsConsent() {
  if (!canUseBrowser()) return false;
  return localStorage.getItem('oro_cookie_consent') === 'accepted';
}

export function setAnalyticsConsent(accepted) {
  localStorage.setItem('oro_cookie_consent', accepted ? 'accepted' : 'declined');
  if (accepted) {
    initAnalytics();
    trackPageView({ consent_source: 'cookie_banner' });
  }
}
