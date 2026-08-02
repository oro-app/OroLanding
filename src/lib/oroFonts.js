// @oro/ui text uses the RN opaque family names from @oro/tokens
// ('Fraunces-SemiBold', 'Inter-Medium', ...). The landing's Google-Fonts
// families ('Fraunces', 'Inter') don't match those names, so each RN name gets
// its own single-face @font-face here (same approach as the design-system
// Storybook: apps/storybook/.storybook/fonts.ts). Existing CSS keeps using
// var(--font-serif/sans) — the two naming worlds coexist.
import interRegular from '@fontsource/inter/files/inter-latin-400-normal.woff2?url'
import interMedium from '@fontsource/inter/files/inter-latin-500-normal.woff2?url'
import interSemiBold from '@fontsource/inter/files/inter-latin-600-normal.woff2?url'
import frauncesLight from '@fontsource/fraunces/files/fraunces-latin-300-normal.woff2?url'
import frauncesRegular from '@fontsource/fraunces/files/fraunces-latin-400-normal.woff2?url'
import frauncesMedium from '@fontsource/fraunces/files/fraunces-latin-500-normal.woff2?url'
import frauncesSemiBold from '@fontsource/fraunces/files/fraunces-latin-600-normal.woff2?url'
import frauncesItalic from '@fontsource/fraunces/files/fraunces-latin-400-italic.woff2?url'
import frauncesMediumItalic from '@fontsource/fraunces/files/fraunces-latin-500-italic.woff2?url'

const FACES = [
  ['Inter-Regular', interRegular, 'normal'],
  ['Inter-Medium', interMedium, 'normal'],
  ['Inter-SemiBold', interSemiBold, 'normal'],
  ['Fraunces-Light', frauncesLight, 'normal'],
  ['Fraunces-Regular', frauncesRegular, 'normal'],
  ['Fraunces-Medium', frauncesMedium, 'normal'],
  ['Fraunces-SemiBold', frauncesSemiBold, 'normal'],
  ['Fraunces-Italic', frauncesItalic, 'italic'],
  ['Fraunces-MediumItalic', frauncesMediumItalic, 'italic'],
]

export function injectOroFonts() {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-oro-fonts]')) return
  const css = FACES.map(
    ([family, url, style]) =>
      `@font-face { font-family: '${family}'; src: url('${url}') format('woff2'); font-style: ${style}; font-display: block; }`,
  ).join('\n')
  const tag = document.createElement('style')
  tag.setAttribute('data-oro-fonts', '')
  tag.textContent = css
  document.head.appendChild(tag)
}
