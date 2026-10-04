import { PRODUCT_FAQS } from './faqs.js'
import { getGeoPage, isIndexableGeoPage } from './geoContent.js'
import { ORO_DESCRIPTION } from './geoRoutes.js'

export const SITE_URL = 'https://www.askoro.now'
export const SITE_NAME = 'oro'
export const SITE_TITLE = 'Oro | AI Personal Stylist You Can Text'
export const DEFAULT_DESCRIPTION =
  'Oro is an AI personal stylist you can text. Get outfit recommendations from clothes you already own, tailored to your style and plans.'
export const DEFAULT_IMAGE = '/favicon.webp'
export const DEFAULT_IMAGE_META = {
  type: 'image/webp',
  width: 1071,
  height: 1071,
  alt: 'oro mascot logo',
}
export const LOGO_IMAGE = '/oro-logo.webp'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

export const ROUTE_SEO = {
  feedback: {
    path: '/feedback',
    title: 'beta feedback - oro',
    description: 'share your oro beta experience using your personal invitation.',
    h1: 'beta feedback',
    noindex: true,
  },
  beta: {
    path: '/beta',
    title: 'help us make oro yours. - oro beta',
    description: 'help shape the earliest oro experience. meet the beta and our first oronauts.',
    h1: 'help us make oro yours.',
    noindex: true,
  },
  signup: {
    path: '/signup',
    title: 'request an oro invite - oro beta',
    description: 'request an invite to meet oro, your personal ai stylist over text.',
    h1: 'where should oro text you?',
    noindex: true,
  },
  'beta-career': {
    path: '/beta/career', title: 'meet oro - your personal ai stylist',
    description: 'get dressed for your next opportunity with oro, right in your texts.',
    h1: 'meet oro.', noindex: true,
  },
  'beta-dating': {
    path: '/beta/dating', title: 'meet oro - your personal ai stylist',
    description: 'find a date-night outfit that feels like you with oro, right in your texts.',
    h1: 'meet oro.', noindex: true,
  },
  home: {
    path: '/',
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    h1: 'the ai fashion assistant you can text',
    summary:
      'Oro is an AI personal stylist you can text for outfit recommendations from your own wardrobe, tailored to your style and plans.',
    priority: '1.0',
  },
  'try-oro': {
    path: '/try-oro',
    title: 'try oro - ai outfit planner and virtual stylist app',
    description:
      'download oro to get outfit ideas from your own clothes, preview looks with virtual try-on, and get dressed faster.',
    h1: 'try oro.',
    summary:
      'oro is free to start and builds outfits from your actual wardrobe in under a minute.',
    priority: '0.9',
    faqs: PRODUCT_FAQS,
  },
  'how-it-works': {
    path: '/how-it-works',
    title: 'how oro works - outfit ideas from your own closet',
    description:
      'see how oro turns your wardrobe, plans, taste, weather, and virtual try-on into outfit recommendations.',
    h1: 'how oro works.',
    summary:
      'add your closet, tell oro where you are going, preview the outfit, and leave with a look made from clothes you own.',
    priority: '0.8',
    faqs: PRODUCT_FAQS,
  },
  'why-oro': {
    path: '/why-oro',
    title: 'why oro - personal styling without buying more clothes',
    description:
      'oro is built around your closet, your taste, your body, and your week, so style recommendations feel personal.',
    h1: 'why oro?',
    summary:
      'oro thinks through color, silhouette, occasion, weather, and taste so your wardrobe is easier to use.',
    priority: '0.8',
    faqs: PRODUCT_FAQS,
  },
  journal: {
    path: '/from-the-closet',
    title: 'From the Closet - oro style notes and newsletter',
    description:
      'Read oro essays and style notes on outfits, fashion, getting dressed, and making more of the clothes you own.',
    h1: 'From the Closet.',
    summary:
      'From the Closet is oro\'s editorial archive on fashion, personal style, wardrobes, and getting dressed.',
    priority: '0.7',
  },
  manifesto: {
    path: '/honestly',
    title: 'honestly - what oro believes about style',
    description:
      'six short beliefs behind oro: personal style, confidence, better outfits, and making the most of your wardrobe.',
    h1: 'honestly.',
    summary:
      'oro believes fashion should work for your life, and that the best outfit may already be in your wardrobe.',
    priority: '0.6',
  },
  contact: {
    path: '/contact',
    title: 'contact oro - help, press, partnerships, and feedback',
    description:
      'contact oro for support, press, partnerships, careers, feedback, or questions about the ai stylist app.',
    h1: 'contact oro.',
    summary:
      'a real person at oro reads support questions, press notes, partnership inquiries, and product feedback.',
    priority: '0.5',
  },
  'get-started': {
    path: '/get-started',
    title: 'complete your beta setup - oro',
    description:
      'invited to the oro beta? answer a few quick questions and verify the phone number on your approved invitation.',
    h1: 'let’s get you set up.',
    summary:
      'approved beta testers complete their oro setup by answering a few questions and verifying their phone number.',
    priority: '0.8',
  },
  'app-terms': {
    path: '/app/terms',
    title: 'oro - Mobile App Terms of Service',
    description: 'Read the terms of service for the oro mobile app.',
    h1: 'Mobile app terms of service',
    summary: 'The terms that govern use of the oro mobile app.',
    priority: '0.3',
  },
  terms: {
    path: '/terms',
    title: 'oro - Terms of Service',
    description: 'Terms for oro’s AI styling service by text, including messaging, photos, subscriptions, and account choices.',
    h1: 'Terms of service',
    summary: 'The terms for using oro’s texting service.',
    priority: '0.3',
  },
  privacy: {
    path: '/privacy',
    title: 'oro - Privacy Policy',
    description: 'How oro handles your phone number, conversations, photos, wardrobe information, and privacy choices when you text oro.',
    h1: 'Privacy policy',
    summary: 'Privacy practices for oro’s texting service and website.',
    priority: '0.3',
  },
  'app-privacy': {
    path: '/app/privacy',
    title: 'oro - Mobile App Privacy Policy',
    description:
      'Read how the oro mobile app collects, uses, protects, and retains account, wardrobe, photo, and app usage information.',
    h1: 'Mobile app privacy policy',
    summary: 'Privacy practices for the oro mobile app, including account data, wardrobe data, photos, analytics, and communications.',
    priority: '0.3',
  },
  cookies: {
    path: '/cookies',
    title: 'oro - Cookie Policy',
    description: 'Read how oro uses browser storage and optional Google Analytics cookies.',
    h1: 'Cookie policy',
    summary: 'oro browser storage, Google Analytics, and consent choices.',
    priority: '0.2',
  },
  'google-play': {
    path: '/google-play',
    title: 'oro - Account Deletion',
    description: 'Learn how to delete your oro account and what happens to retained data.',
    h1: 'Account Deletion',
    summary: 'Instructions for deleting an oro account and understanding retained data.',
    priority: '0.2',
  },
}

export const PUBLIC_ROUTE_TYPES = [
  'home',
  'try-oro',
  'how-it-works',
  'why-oro',
  'journal',
  'manifesto',
  'contact',
  'get-started',
  'app-terms',
  'app-privacy',
  'terms',
  'privacy',
  'cookies',
  'google-play',
]

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function getImageUrl(image = DEFAULT_IMAGE) {
  return absoluteUrl(image)
}

export function getBaseJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      legalName: 'Oro Digital Inc.',
      description: ORO_DESCRIPTION,
      url: SITE_URL,
      logo: getImageUrl(LOGO_IMAGE),
      sameAs: [
        'https://www.instagram.com/askoro.now',
        'https://www.linkedin.com/company/askoro',
        'https://x.com/askoro_now',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': ORGANIZATION_ID },
    },
  ]
}

export function makeBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function makeFaqJsonLd(faqs = []) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

function makeSoftwareJsonLd(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'iOS, Android',
    url: absoluteUrl(page.path),
    description: page.description,
    image: getImageUrl(DEFAULT_IMAGE),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
    },
    publisher: { '@id': ORGANIZATION_ID },
  }
}

function makeTextStylistJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#text-stylist`,
    name: 'Oro',
    applicationCategory: 'LifestyleApplication',
    description: ORO_DESCRIPTION,
    url: absoluteUrl('/ai-personal-stylist'),
    publisher: { '@id': ORGANIZATION_ID },
  }
}

function makeArticleJsonLd(newsletter) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: newsletter.title,
    description: newsletter.summary || DEFAULT_DESCRIPTION,
    image: getImageUrl(newsletter.image || DEFAULT_IMAGE),
    datePublished: newsletter.date || undefined,
    dateModified: newsletter.date || undefined,
    mainEntityOfPage: absoluteUrl(newsletter.href),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  }
}

export function makePageJsonLd(page, extras = []) {
  const graph = [
    ...getBaseJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url: absoluteUrl(page.path),
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
    },
    makeBreadcrumbJsonLd(page.breadcrumbs || [
      { name: 'Home', path: '/' },
      ...(page.path === '/' ? [] : [{ name: page.h1 || page.title, path: page.path }]),
    ]),
    ...extras,
  ].filter(Boolean)

  return graph
}

export function getSeoForRoute(route, newsletter) {
  if (route?.type === 'geo') {
    const content = getGeoPage(route.path)
    if (!content) throw new Error(`Missing GEO content for ${route.path}`)
    const noindex = !isIndexableGeoPage(content)
    const article = content.kind === 'guide' || (['research-article', 'engineering-note'].includes(content.kind) && !noindex)
    const page = {
      path: content.path,
      title: content.title,
      description: content.description,
      h1: content.h1,
      noindex,
      ogType: article ? 'article' : 'website',
      image: DEFAULT_IMAGE,
      date: content.publicationDate || content.dateModified,
      breadcrumbs: [
        { name: 'Oro', path: '/' },
        ...(['research-article', 'engineering-note'].includes(content.kind) ? [{ name: 'Research & Engineering', path: '/research' }] : []),
        { name: content.h1, path: content.path },
      ],
    }
    const extras = article ? [{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.h1,
      description: content.description,
      mainEntityOfPage: absoluteUrl(content.path),
      author: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID },
      ...(content.publicationDate ? { datePublished: content.publicationDate } : {}),
      ...(content.dateModified ? { dateModified: content.dateModified } : {}),
    }] : []
    if (['/ai-personal-stylist', '/ai-stylist-you-can-text'].includes(content.path)) extras.push(makeTextStylistJsonLd())
    return { ...page, jsonLd: makePageJsonLd(page, extras) }
  }
  if (route?.type === 'newsletter') {
    const page = newsletter
      ? {
        path: newsletter.href,
        title: `${newsletter.title} - oro`,
        description: newsletter.summary || DEFAULT_DESCRIPTION,
        h1: newsletter.title,
        summary: newsletter.summary || '',
        image: newsletter.image || DEFAULT_IMAGE,
        date: newsletter.date,
        priority: '0.6',
      }
      : {
        path: `/newsletter/${route.slug || ''}`,
        title: 'Newsletter - oro',
        description: 'This oro newsletter could not be found.',
        h1: 'Newsletter not found',
        summary: 'This oro newsletter could not be found.',
        noindex: true,
      }

    return {
      ...page,
      image: page.image || DEFAULT_IMAGE,
      jsonLd: newsletter
        ? makePageJsonLd(page, [makeArticleJsonLd(newsletter)])
        : makePageJsonLd(page),
    }
  }

  const page = ROUTE_SEO[route?.type] || ROUTE_SEO.home
  const extras = []

  if (route?.type === 'home') extras.push(makeTextStylistJsonLd())

  if (['try-oro', 'how-it-works', 'why-oro'].includes(route?.type)) {
    extras.push(makeSoftwareJsonLd(page))
  }
  if (page.faqs) {
    extras.push(makeFaqJsonLd(page.faqs))
  }

  return {
    ...page,
    image: DEFAULT_IMAGE,
    jsonLd: makePageJsonLd(page, extras),
  }
}
