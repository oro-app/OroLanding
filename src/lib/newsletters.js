import { lazy } from 'react'

// Each article is self-contained: its `export const meta` is the single source
// of truth for listing + release. The component stays lazy (one chunk per
// article); `meta` is pulled eagerly (tiny object, tree-shakes away the body).
// No central registry — adding or releasing an article touches only its .mdx.
const newsletterModules = import.meta.glob('../content/newsletters/*.mdx')
const newsletterMetas = import.meta.glob('../content/newsletters/*.mdx', {
  eager: true,
  import: 'meta',
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

// Release gating. By default an issue releases at UTC-midnight of meta.date
// (date-only, compared lexically against today's UTC date — string compare is
// chronological). An issue MAY instead set meta.releaseAt to a full ISO
// timestamp for to-the-minute control (e.g. noon Eastern = 16:00Z in summer);
// when present it takes precedence over the date-only check. meta.date is still
// used for the displayed label and the sort order.
const now = new Date()
const todayISO = now.toISOString().slice(0, 10)

function hasReleased(newsletter) {
  if (newsletter.releaseAt) {
    const releaseTime = new Date(newsletter.releaseAt)
    if (!Number.isNaN(releaseTime.getTime())) return releaseTime <= now
  }
  return !newsletter.date || newsletter.date <= todayISO
}

export const newsletters = Object.entries(newsletterModules)
  .map(([path, loader]) => {
    const file = slugFromPath(path)
    const meta = newsletterMetas[path] || {}
    const slug = meta.slug || file

    return {
      slug,
      href: `/newsletter/${slug}`,
      published: meta.published,
      title: meta.title || titleFromSlug(slug),
      italicTitle: meta.italicTitle || '',
      tag: meta.tag || 'Oro Insiders',
      date: meta.date || '',
      releaseAt: meta.releaseAt || '',
      dateLabel: formatNewsletterDate(meta.date),
      image: meta.image || '/static/oro-logo.png',
      summary: meta.summary || '',
      readTime: meta.readTime || '',
      comingSoon: meta.comingSoon,
      Component: lazy(loader),
    }
  })
  // Published AND released (releaseAt timestamp if set, else date-only at UTC
  // midnight). Future issues stay hidden everywhere until then, so they can be
  // written ahead and auto-release.
  .filter((newsletter) => newsletter.published === true && hasReleased(newsletter))
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))

export const readableNewsletters = newsletters.filter((newsletter) => !newsletter.comingSoon)

export function getNewsletterBySlug(slug) {
  return readableNewsletters.find((newsletter) => newsletter.slug === slug)
}
