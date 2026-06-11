const newsletterModules = import.meta.glob('../content/newsletters/*.mdx', {
  eager: true,
})

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.mdx$/, '')
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatNewsletterDate(value) {
  if (!value) return ''

  const parts = String(value).split('-').map(Number)
  const date = parts.length === 3
    ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
    : new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// Date-only "today" (YYYY-MM-DD, UTC) for release gating. Compared lexically
// against meta.date, which is also YYYY-MM-DD — string compare is chronological.
const todayISO = new Date().toISOString().slice(0, 10)

export const newsletters = Object.entries(newsletterModules)
  // Published AND the send date has arrived. Future-dated issues stay hidden
  // everywhere until their date, so issues can be written ahead and auto-release.
  .filter(([, module]) => {
    const m = module.meta
    return m?.published === true && (!m.date || m.date <= todayISO)
  })
  .map(([path, module]) => {
    const slug = module.meta?.slug || slugFromPath(path)

    return {
      slug,
      href: `/newsletter/${slug}`,
      published: module.meta.published,
      title: module.meta?.title || titleFromSlug(slug),
      // Optional italic-accent word(s) inside the title. When the title is
      // rendered on /journal, this substring is wrapped in <em>. Set in the
      // MDX frontmatter as `italicTitle: 'closet.'` (must be a substring of
      // the title to match).
      italicTitle: module.meta?.italicTitle || '',
      tag: module.meta?.tag || 'Oro Insiders',
      date: module.meta?.date || '',
      dateLabel: formatNewsletterDate(module.meta?.date),
      image: module.meta?.image || '/static/oro-logo.png',
      summary: module.meta?.summary || '',
      readTime: module.meta?.readTime || '',
      Component: module.default,
    }
  })
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))

export function getNewsletterBySlug(slug) {
  return newsletters.find((newsletter) => newsletter.slug === slug)
}
