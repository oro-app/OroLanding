const token = new URLSearchParams(location.hash.slice(1)).get('t') || ''
const grid = document.querySelector('#grid')
const status = document.querySelector('#status')
const search = document.querySelector('#search')
const category = document.querySelector('#category')
const color = document.querySelector('#color')
const refresh = document.querySelector('#refresh')
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
  document.querySelector('#expiry').textContent = ''
  refresh.disabled = true
  search.disabled = category.disabled = color.disabled = true
  document.querySelector('#categories').replaceChildren()
}

function render() {
  if (expired) return
  const query = search.value.trim().toLowerCase()
  const visible = items.filter(item => (!category.value || item.category === category.value)
    && (!color.value || item.color === color.value)
    && [item.description, item.subtype, item.category, item.color, item.material, ...(item.aesthetic_tags || [])]
      .join(' ').toLowerCase().includes(query))
  grid.replaceChildren()
  const message = items.length ? `${visible.length === items.length ? items.length : `${visible.length} of ${items.length}`} items${visible.length ? '' : ' — try another search or filter'}`
    : 'Your closet is built over text. Send oro a photo to add your first piece.'
  if (status.textContent !== message) status.textContent = message
  for (const button of document.querySelectorAll('#categories button')) {
    button.setAttribute('aria-pressed', String(button.value === category.value))
  }
  for (const item of visible) {
    const card = document.createElement('article')
    card.className = 'card'
    const photo = document.createElement('div')
    photo.className = 'photo'
    photo.textContent = 'No photo yet'
    if (item.image && /^https:\/\//.test(item.image)) {
      const img = document.createElement('img')
      img.src = item.image
      img.alt = item.description || item.subtype || item.category
      img.loading = 'lazy'
      img.referrerPolicy = 'no-referrer'
      img.onerror = () => { photo.textContent = 'Photo unavailable' }
      photo.replaceChildren(img)
    }
    const title = document.createElement('h2')
    title.textContent = [item.color, item.subtype || item.category].filter(Boolean).join(' ')
    const description = document.createElement('p')
    description.textContent = item.description || item.material || ''
    card.append(photo, title, description)
    grid.append(card)
  }
}

function options(select, field, label) {
  const value = select.value
  select.replaceChildren(new Option(label, ''))
  for (const name of [...new Set(items.map(item => item[field]).filter(Boolean))].sort()) {
    select.add(new Option(name, name))
  }
  select.value = [...select.options].some(option => option.value === value) ? value : ''
}

function categories() {
  const container = document.querySelector('#categories')
  const names = [...category.options].map(option => option.value).filter(Boolean)
  if (JSON.stringify(names) === container.dataset.names) return
  container.dataset.names = JSON.stringify(names)
  container.replaceChildren()
  for (const name of names) {
    const button = document.createElement('button')
    button.type = 'button'
    button.value = name
    button.textContent = name
    button.addEventListener('click', () => {
      category.value = category.value === name ? '' : name
      render()
    })
    container.append(button)
  }
}

function showControls(open, target) {
  document.querySelector('#controls').hidden = !open
  for (const button of document.querySelectorAll('[aria-controls="controls"]')) {
    button.setAttribute('aria-expanded', String(open))
  }
  if (open) target.focus()
}

for (const button of document.querySelectorAll('[data-search]')) {
  button.addEventListener('click', () => showControls(true, search))
}
document.querySelector('#filters').addEventListener('click', () => {
  showControls(document.querySelector('#controls').hidden, category)
})
document.querySelector('#show-closet').addEventListener('click', () => {
  showControls(false)
  window.scrollTo({ top: 0, behavior: 'instant' })
  document.querySelector('h1').focus()
})

async function load() {
  if (expired || loading) return
  if (expiresAt && Date.now() >= expiresAt) return expire()
  loading = true
  refresh.disabled = true
  try {
    const response = await fetch('/api/closet', {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000),
    })
    if ([401, 403, 404].includes(response.status)) return expire()
    if (!response.ok) throw new Error()
    const data = await response.json()
    if (expired) return
    expiresAt = data.expires_at * 1000
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return expire()
    items = data.items
    clearTimeout(expiryTimer)
    expiryTimer = setTimeout(expire, Math.max(0, expiresAt - Date.now()))
    options(category, 'category', 'All categories')
    options(color, 'color', 'All colors')
    categories()
    render()
    document.querySelector('#expiry').textContent = `Updates every 15 seconds · Link expires at ${new Date(expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  } catch {
    if (!expired) status.textContent = 'Could not refresh your closet. Please try again.'
  } finally {
    loading = false
    refresh.disabled = expired
  }
}

search.addEventListener('input', render)
category.addEventListener('change', render)
color.addEventListener('change', render)
refresh.addEventListener('click', load)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) load()
})
window.addEventListener('pageshow', load)
setInterval(() => { if (!document.hidden) load() }, 15000)
if (/^[A-Za-z0-9_-]{43}$/.test(token)) load()
else expire()
