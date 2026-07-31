const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

function getToken() {
  return localStorage.getItem('sketchline_token')
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = 'Something went wrong'
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch (_) {
      /* ignore parse errors */
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/api/auth/me'),

  listDiagrams: () => request('/api/diagrams'),
  createDiagram: (title) => request('/api/diagrams', { method: 'POST', body: { title } }),
  getDiagram: (id) => request(`/api/diagrams/${id}`),
  updateDiagram: (id, payload) => request(`/api/diagrams/${id}`, { method: 'PUT', body: payload }),
  deleteDiagram: (id) => request(`/api/diagrams/${id}`, { method: 'DELETE' }),

  cleanUp: (strokes, canvasWidth, canvasHeight) =>
    request('/api/ai/clean-up', {
      method: 'POST',
      body: { strokes, canvas_width: canvasWidth, canvas_height: canvasHeight },
    }),
}

export function wsUrl(diagramId) {
  const token = getToken()
  return `${WS_BASE}/ws/diagram/${diagramId}?token=${encodeURIComponent(token || '')}`
}

export { getToken }
