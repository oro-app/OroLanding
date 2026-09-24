import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// Both packages define .oro-chip. Scope their recipes to separate surfaces so
// adopting Halo at home cannot restyle the remaining signup and editorial routes.
const scopeHalo = {
  postcssPlugin: 'scope-halo-homepage',
  Rule(rule) {
    const source = rule.source?.input.file || ''
    if (rule.selector.includes('.halo-site')) return
    if (source.includes('/node_modules/oro-kit/')) {
      if (rule.selector === ':root') return
      rule.selectors = rule.selectors.map((selector) => selector === '.oro-theme'
        ? ':where(.halo-site).oro-theme'
        : `:where(.halo-site) ${selector}`)
    } else if (source.includes('/node_modules/@oro/web/')) {
      rule.selectors = rule.selectors.map((selector) => selector.startsWith(':root')
        ? selector.replace(':root', ':root:where(:not(:has(.halo-site)))')
        : `:where(:root:not(:has(.halo-site))) ${selector}`)
    }
  },
}

export default {
  plugins: [tailwindcss(), autoprefixer(), scopeHalo],
}
