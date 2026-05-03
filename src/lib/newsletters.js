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

export const newsletters = Object.entries(newsletterModules)
  .map(([path, module]) => {
    const slug = module.meta?.slug || slugFromPath(path)

    return {
      slug,
      href: `/newsletter/${slug}`,
      title: module.meta?.title || titleFromSlug(slug),
      date: module.meta?.date || '',
      dateLabel: formatNewsletterDate(module.meta?.date),
      image: module.meta?.image || '/static/oro-4.png',
      summary: module.meta?.summary || '',
      Component: module.default,
    }
  })
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))

export function getNewsletterBySlug(slug) {
  return newsletters.find((newsletter) => newsletter.slug === slug)
}
