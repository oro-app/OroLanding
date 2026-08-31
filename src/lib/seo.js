export const SITE_URL = 'https://buildingoro.ca'
export const SITE_NAME = 'Oro'
export const SITE_TITLE = 'Oro - AI stylist for the clothes you already own'
export const DEFAULT_DESCRIPTION =
  'Oro is an AI stylist that builds outfits from the clothes you already own, tuned to your closet, taste, plans, weather, and body.'
export const DEFAULT_IMAGE = '/thumbnail.webp'
export const LOGO_IMAGE = '/static/oro-logo.png'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

export const ROUTE_SEO = {
  home: {
    path: '/',
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    h1: 'the #1 ai stylist you can text',
    summary:
      'Oro helps you get dressed with outfits built from your own closet, not a shopping feed.',
    priority: '1.0',
  },
  journal: {
    path: '/from-the-closet',
    title: 'From the Closet - Oro style notes and newsletter',
    description:
      'Read Oro essays and style notes on outfits, fashion, getting dressed, and making more of the clothes you own.',
    h1: 'From the Closet.',
    summary:
      'From the Closet is Oro\'s editorial archive on fashion, personal style, wardrobes, and getting dressed.',
    priority: '0.7',
  },
  contact: {
    path: '/contact',
    title: 'Contact Oro - Help, press, partnerships, and feedback',
    description:
      'Contact Oro for support, press, partnerships, careers, feedback, or questions about the AI stylist app.',
    h1: 'Contact Oro.',
    summary:
      'A real person at Oro reads support questions, press notes, partnership inquiries, and product feedback.',
    priority: '0.5',
  },
  'get-started': {
    path: '/get-started',
    title: 'Get Started - Oro texts you your first outfit',
    description:
      'Sign up for Oro in under two minutes: a few quick questions, then Oro texts you and styles your first outfit from your own closet.',
    h1: 'your stylist is 2 minutes away.',
    summary:
      'The Oro signup flow: answer a few questions, verify your number, and Oro texts you to start styling.',
    priority: '0.8',
  },
  terms: {
    path: '/terms',
    title: 'Oro - Terms of Service',
    description: 'Read the Oro terms of service.',
    h1: 'Terms of Service',
    summary: 'The terms that govern use of Oro.',
    priority: '0.3',
  },
  privacy: {
    path: '/privacy',
    title: 'Oro - Privacy Policy',
    description:
      'Read how Oro collects, uses, protects, and retains account, wardrobe, photo, and app usage information.',
    h1: 'Privacy Policy',
    summary: 'Oro privacy practices for account data, wardrobe data, photos, analytics, and communications.',
    priority: '0.3',
  },
  cookies: {
    path: '/cookies',
    title: 'Oro - Cookie Policy',
    description: 'Read how Oro uses essential and analytics cookies.',
    h1: 'Cookie Policy',
    summary: 'Oro cookie usage and analytics consent information.',
    priority: '0.2',
  },
  'google-play': {
    path: '/google-play',
    title: 'Oro - Account Deletion',
    description: 'Learn how to delete your Oro account and what happens to retained data.',
    h1: 'Account Deletion',
    summary: 'Instructions for deleting an Oro account and understanding retained data.',
    priority: '0.2',
  },
}

export const PUBLIC_ROUTE_TYPES = [
  'home',
  'journal',
  'contact',
  'get-started',
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
      url: SITE_URL,
      logo: getImageUrl(LOGO_IMAGE),
      sameAs: [
        'https://www.instagram.com/oro.wardrobe/',
        'https://www.tiktok.com/@oro.wardrobe',
        'https://www.linkedin.com/company/buildingoro/',
        'https://linktr.ee/buildingoro',
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
    makeBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      ...(page.path === '/' ? [] : [{ name: page.h1 || page.title, path: page.path }]),
    ]),
    ...extras,
  ].filter(Boolean)

  return graph
}

export function getSeoForRoute(route, newsletter) {
  if (route?.type === 'newsletter') {
    const page = newsletter
      ? {
          path: newsletter.href,
          title: `${newsletter.title} - Oro`,
          description: newsletter.summary || DEFAULT_DESCRIPTION,
          h1: newsletter.title,
          summary: newsletter.summary || '',
          image: newsletter.image || DEFAULT_IMAGE,
          date: newsletter.date,
          priority: '0.6',
        }
      : {
          path: `/newsletter/${route.slug || ''}`,
          title: 'Newsletter - Oro',
          description: 'This Oro newsletter could not be found.',
          h1: 'Newsletter not found',
          summary: 'This Oro newsletter could not be found.',
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

  if (route?.type === 'home') {
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
