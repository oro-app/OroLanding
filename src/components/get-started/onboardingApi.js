const API_BASE = import.meta.env.VITE_ORO_API_URL || 'https://api.buildingoro.ca'

export async function postOnboarding(path, body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${API_BASE}/onboarding/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })
    const data = await response.json().catch(() => null)
    const detail = data?.detail
    const retryHeader = response.headers.get('Retry-After')
    const retrySeconds = retryHeader && (/^\d+$/.test(retryHeader)
      ? Number(retryHeader)
      : (Date.parse(retryHeader) - Date.now()) / 1000)
    return {
      status: response.status,
      result: data?.status,
      code: typeof detail?.code === 'string' ? detail.code : typeof data?.code === 'string' ? data.code : '',
      detail: typeof detail === 'string' ? detail : typeof detail?.message === 'string' ? detail.message : '',
      retryAfter: Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.ceil(retrySeconds) : 60,
    }
  } finally {
    clearTimeout(timeout)
  }
}
