const token = new URLSearchParams(location.hash.slice(1)).get('t') || ''
const grid = document.querySelector('#grid')
const status = document.querySelector('#status')
const search = document.querySelector('#search')
let category = ''
const color = document.querySelector('#color')
let selectedColor = ''
const dialog = document.querySelector('#item-dialog')
let selectedItem
let mutating = false
let revision = 0
let opener
let items = []
let expiresAt = 0
let expired = false
let loading = false
let expiryTimer

function expire() {
  expired = true
  items = []
  grid.replaceChildren()
  status.textContent = 'This link is unavailable or expired. Text oro for a new closet link.'
  dialog.close()
  selectedItem = null
  document.querySelector('#item-photo').replaceChildren()
  document.querySelector('#item-details').replaceChildren()
  document.querySelector('#item-heading').textContent = ''
  document.querySelector('#item-title').value = ''
  search.disabled = color.disabled = true
  document.querySelector('#filters').open = false
  document.querySelector('#categories').replaceChildren()
}

function render() {
  if (expired) return
  const query = search.value.trim().toLowerCase()
  const visible = items.filter(item => (!category || item.category === category)
    && (!selectedColor || item.color === selectedColor)
    && [item.title, item.description, item.subtype, item.category, item.color, item.material, ...(item.aesthetic_tags || [])]
      .join(' ').toLowerCase().includes(query))
  grid.replaceChildren()
  const message = items.length ? `${visible.length === items.length ? items.length : `${visible.length} of ${items.length}`} items${visible.length ? '' : ' — try another search or filter'}`
    : 'Your closet is built over text. Send oro a photo to add your first piece.'
  if (status.textContent !== message) status.textContent = message
  for (const button of document.querySelectorAll('#categories button')) {
    button.setAttribute('aria-pressed', String(button.value === category))
  }
  for (const item of visible) {
    const card = document.createElement('article')
    card.className = 'card'
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.id = item.id
    button.setAttribute('aria-label', `View ${itemTitle(item)}`)
    button.addEventListener('click', () => openItem(item, button))
    const title = document.createElement('h2')
    title.textContent = itemTitle(item)
    button.append(itemPhoto(item), title)
    card.append(button)
    grid.append(card)
  }
}

function colors() {
  const names = ['', ...new Set(items.map(item => item.color).filter(Boolean).sort())]
  if (!names.includes(selectedColor)) selectedColor = ''
  const container = document.querySelector('#color-options')
  if (container.dataset.names === JSON.stringify(names)) return
  container.dataset.names = JSON.stringify(names)
  container.replaceChildren()
  for (const name of names) {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'color'
    input.value = name
    input.checked = name === selectedColor
    label.append(input, name || 'All colors')
    container.append(label)
  }
}

function categories() {
  const container = document.querySelector('#categories')
  const names = [...new Set(items.map(item => item.category).filter(Boolean))].sort()
  if (!names.includes(category)) category = ''
  if (JSON.stringify(names) === container.dataset.names) return
  container.dataset.names = JSON.stringify(names)
  container.replaceChildren()
  for (const name of names) {
    const button = document.createElement('button')
    button.type = 'button'
    button.value = name
    button.textContent = name
    button.addEventListener('click', () => {
      category = category === name ? '' : name
      render()
    })
    container.append(button)
  }
}

document.addEventListener('click', event => {
  if (!event.target.closest('#filters')) document.querySelector('#filters').open = false
})
document.querySelector('#filters').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault()
    document.querySelector('#filters').open = false
    document.querySelector('#filters summary').focus()
  }
})
async function load() {
  if (expired || loading || mutating || dialog.open) return
  if (expiresAt && Date.now() >= expiresAt) return expire()
  loading = true
  const loadedRevision = revision
  try {
    const response = await fetch('/api/closet', {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000),
    })
    if ([401, 403, 404].includes(response.status)) return expire()
    if (!response.ok) throw new Error()
    const data = await response.json()
    if (expired || loadedRevision !== revision || dialog.open) return
    expiresAt = data.expires_at * 1000
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return expire()
    items = data.items
    clearTimeout(expiryTimer)
    expiryTimer = setTimeout(expire, Math.max(0, expiresAt - Date.now()))
    colors()
    categories()
    render()
  } catch {
    if (!expired) status.textContent = 'Could not load your closet. Retrying automatically.'
  } finally {
    loading = false
  }
}

function itemTitle(item) {
  return item.title || [item.color, item.subtype || item.category].filter(Boolean).join(' ') || 'Clothing item'
}

function itemPhoto(item) {
  const photo = document.createElement('div')
  photo.className = 'photo'
  photo.textContent = 'No photo yet'
  if (item.image && /^https:\/\//.test(item.image)) {
    const img = document.createElement('img')
    img.src = item.image
    img.alt = item.description || itemTitle(item)
    img.loading = 'lazy'
    img.referrerPolicy = 'no-referrer'
    img.onerror = () => { photo.textContent = 'Photo unavailable' }
    photo.replaceChildren(img)
  }
  return photo
}

function openItem(item, button) {
  if (expired) return
  if (Date.now() >= expiresAt) return expire()
  if (mutating) {
    status.textContent = 'Please wait for your change to finish saving.'
    return
  }
  selectedItem = item
  opener = button
  document.querySelector('#item-title-display').hidden = false
  document.querySelector('#edit-item').hidden = true
  document.querySelector('#item-photo').replaceChildren(itemPhoto(item))
  document.querySelector('#item-heading').textContent = itemTitle(item)
  document.querySelector('#item-title').value = itemTitle(item)
  document.querySelector('#item-title').setCustomValidity('')
  document.querySelector('#item-status').textContent = ''
  document.querySelector('#delete-confirmation').hidden = true
  const details = document.querySelector('#item-details')
  details.replaceChildren()
  for (const [label, value] of [['Description', item.description], ['Category', item.category], ['Color', item.color], ['Material', item.material], ['Fit', item.fit]]) {
    if (!value) continue
    const section = document.createElement('div')
    if (label === 'Description' || label === 'Category') section.className = 'full-width'
    const term = document.createElement('dt')
    const description = document.createElement('dd')
    term.textContent = label
    description.textContent = value
    if (label === 'Color') {
      const swatch = document.createElement('span')
      swatch.className = 'color-swatch'
      swatch.setAttribute('aria-hidden', 'true')
      const name = value.toLowerCase().replace(/[\s-]/g, '')
      swatch.style.backgroundColor = ({ cream: 'ivory', burgundy: 'maroon', charcoal: 'darkslategray', nude: 'tan', camel: 'tan', blush: 'pink', denim: 'steelblue' })[name] || name
      description.prepend(swatch)
      description.className = 'item-color'
    }
    section.append(term, description)
    details.append(section)
  }
  dialog.showModal()
}

document.querySelector('#close-item').addEventListener('click', () => dialog.close())
dialog.addEventListener('close', () => {
  if (expired) document.querySelector('h1').focus()
  else if (opener?.isConnected) opener.focus()
  else (Array.from(grid.querySelectorAll('button')).find(button => button.dataset.id === selectedItem?.id)
    || document.querySelector('h1')).focus()
})
document.querySelector('#delete-item').addEventListener('click', () => {
  document.querySelector('#delete-confirmation').hidden = false
  document.querySelector('#cancel-delete').focus()
})
document.querySelector('#cancel-delete').addEventListener('click', () => {
  document.querySelector('#delete-confirmation').hidden = true
  document.querySelector('#delete-item').focus()
})
document.querySelector('#item-title').addEventListener('input', event => event.target.setCustomValidity(''))

function editTitle(editing) {
  document.querySelector('#item-title-display').hidden = editing
  document.querySelector('#edit-item').hidden = !editing
  const input = document.querySelector('#item-title')
  input.value = itemTitle(selectedItem)
  input.setCustomValidity('')
  if (editing) {
    input.focus()
    input.select()
  } else if (dialog.open) document.querySelector('#edit-title').focus()
}

document.querySelector('#edit-title').addEventListener('click', () => editTitle(true))
document.querySelector('#edit-item').addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (!mutating) editTitle(false)
  }
})
document.querySelector('#edit-item').addEventListener('submit', event => {
  event.preventDefault()
  const input = document.querySelector('#item-title')
  if (!input.value.trim()) {
    input.setCustomValidity('Enter a title.')
    input.reportValidity()
    return
  }
  mutate('PATCH', { title: input.value.trim() })
})
document.querySelector('#confirm-delete').addEventListener('click', () => mutate('DELETE'))

async function mutate(method, body) {
  if (expired || mutating) return
  if (Date.now() >= expiresAt) return expire()
  const item = selectedItem
  mutating = true
  revision++
  for (const control of dialog.querySelectorAll('button:not(#close-item), input')) control.disabled = true
  document.querySelector('#item-status').textContent = method === 'DELETE' ? 'Deleting item...' : 'Saving title...'
  try {
    const response = await fetch(`/api/closet?item_id=${encodeURIComponent(item.id)}`, {
      method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000),
    })
    if (expired) return
    if ([401, 403].includes(response.status)) return expire()
    if (response.status === 404) {
      items = items.filter(candidate => candidate.id !== item.id)
      render()
      dialog.close()
      status.textContent = 'This item is no longer available.'
      return
    }
    if (!response.ok) throw new Error()
    if (expired) return
    if (method === 'DELETE') {
      items = items.filter(candidate => candidate.id !== item.id)
      colors()
      categories()
      render()
      dialog.close()
      status.textContent = 'Item deleted.'
    } else {
      const data = await response.json()
      if (expired) return
      item.title = data.title
      items = items.map(candidate => candidate.id === item.id ? { ...candidate, title: data.title } : candidate)
      render()
      if (selectedItem === item) {
        document.querySelector('#item-heading').textContent = itemTitle(item)
        document.querySelector('#item-title').value = itemTitle(item)
        document.querySelector('#item-status').textContent = 'Title saved.'
        editTitle(false)
      }
    }
  } catch {
    if (!expired) document.querySelector('#item-status').textContent = 'Could not save this change. Please try again.'
  } finally {
    mutating = false
    for (const control of dialog.querySelectorAll('button, input')) control.disabled = false
    if (dialog.open && document.querySelector('#edit-item').hidden && method === 'PATCH') {
      document.querySelector('#edit-title').focus()
    }
  }
}

search.addEventListener('input', render)
color.addEventListener('change', event => {
  selectedColor = event.target.value
  render()
})
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) load()
})
window.addEventListener('pageshow', load)
setInterval(() => { if (!document.hidden) load() }, 15000)
if (/^[A-Za-z0-9_-]{43}$/.test(token)) load()
else expire()
