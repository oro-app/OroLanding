// Single source of truth for the site's navigational columns. Consumed by
// both SiteFooter (as columns) and SiteHeader (as dropdown menus) so the two
// stay literally identical — change a link here and it updates both places.
//
// Every link opens in a new tab, matching the site-wide link policy.
export const NAV_COLUMNS = [
  {
    head: 'product',
    links: [
      { label: 'get started', href: '/get-started' },
    ],
  },
  {
    head: 'editorial',
    links: [
      { label: 'from the closet', href: '/from-the-closet' },
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
