import { lazy } from 'react'
import { newsletterMeta } from './newsletterMeta'

const newsletterModules = import.meta.glob('../content/newsletters/*.mdx')
const newsletterMetaByFile = new Map(newsletterMeta.map((entry) => [entry.file, entry]))

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
  .map(([path, loader]) => {
    const file = slugFromPath(path)
    const meta = newsletterMetaByFile.get(file) || {}
    const slug = meta.slug || file

    return {
      slug,
      href: `/newsletter/${slug}`,
      published: meta.published,
      title: meta.title || titleFromSlug(slug),
      italicTitle: meta.italicTitle || '',
      tag: meta.tag || 'Oro Insiders',
      date: meta.date || '',
      dateLabel: formatNewsletterDate(meta.date),
      image: meta.image || '/static/oro-logo.png',
      summary: meta.summary || '',
      readTime: meta.readTime || '',
      comingSoon: meta.comingSoon,
      Component: lazy(loader),
    }
  })
  // Published AND the send date has arrived. Future-dated issues stay hidden
  // everywhere until their date, so issues can be written ahead and auto-release.
  .filter((newsletter) => newsletter.published === true && (!newsletter.date || newsletter.date <= todayISO))
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))

export const readableNewsletters = newsletters.filter((newsletter) => !newsletter.comingSoon)

export function getNewsletterBySlug(slug) {
  return readableNewsletters.find((newsletter) => newsletter.slug === slug)
}
