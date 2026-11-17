import { createElement } from 'react'

export function readProductDescription(html) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  function render(node, key) {
    if (node.nodeType === 3) return node.textContent
    if (node.nodeType !== 1 || ['SCRIPT', 'STYLE', 'TEMPLATE'].includes(node.nodeName)) return null
    const children = Array.from(node.childNodes, render)
    const tag = node.nodeName.toLowerCase()
    // Render only formatting elements, without Shopify HTML attributes or scripts.
    return ['p', 'div', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 's', 'u'].includes(tag)
      ? createElement(tag, { key }, tag === 'br' ? undefined : children)
      : children
  }
  return Array.from(document.body.childNodes, render)
}
