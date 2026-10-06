// Shared source for the site's header dropdowns and matching footer columns.
// Links that should appear only in a footer are added by that footer instead.
//
// Every link opens in a new tab, matching the site-wide link policy.
export const NAV_COLUMNS = [
  {
    head: 'product',
    links: [
      { label: 'try oro',      href: '/try-oro' },
      { label: 'why oro?',     href: '/why-oro' },
    ],
  },
  {
    head: 'editorial',
    links: [
      { label: 'from the closet', href: '/from-the-closet' },
      { label: 'honestly…',       href: '/honestly' },
    ],
  },
  {
    head: 'say hi.',
    links: [
      { label: 'contact & help',        href: '/contact' },
      { label: 'admin@buildingoro.ca',  href: 'mailto:admin@buildingoro.ca' },
      { label: 'instagram',             href: 'https://www.instagram.com/oro.wardrobe/' },
      { label: 'tiktok',                href: 'https://www.tiktok.com/@oro.wardrobe' },
      { label: 'linkedin',              href: 'https://www.linkedin.com/company/buildingoro/' },
      { label: 'linktree',              href: 'https://linktr.ee/buildingoro' },
    ],
  },
  {
    head: 'legal',
    links: [
      { label: 'terms',   href: '/terms' },
      { label: 'privacy', href: '/privacy' },
      { label: 'cookies', href: '/cookies' },
    ],
  },
]

export const FOOTER_LINKS = [
  { label: 'about us', href: '/about' },
  { label: 'from the closet', href: '/from-the-closet' },
  { label: 'contact', href: '/contact' },
  { label: 'terms', href: '/terms' },
  { label: 'privacy', href: '/privacy' },
  { label: 'cookies', href: '/cookies' },
]
