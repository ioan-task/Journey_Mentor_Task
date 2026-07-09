import type { VercelRequest, VercelResponse } from '@vercel/node'

const DUFFEL_BASE = 'https://api.duffel.com'

// Only the two endpoints the app needs are proxied. Everything else is rejected
// so the deployment URL cannot be abused as an open Duffel proxy.
const ALLOWED_ROUTES = [
  { method: 'POST', path: 'air/offer_requests' },
  { method: 'GET', path: 'places/suggestions' },
] as const

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  const segments = req.query.path
  const path = Array.isArray(segments) ? segments.join('/') : (segments ?? '')

  const route = ALLOWED_ROUTES.find((candidate) => candidate.path === path)
  if (!route) {
    res.status(404).json({ errors: [{ message: `Unknown proxy path: ${path}` }] })
    return
  }
  if (req.method !== route.method) {
    res.status(405).json({ errors: [{ message: `${req.method} is not allowed for ${path}` }] })
    return
  }

  const token = process.env.DUFFEL_ACCESS_TOKEN
  if (!token) {
    res
      .status(500)
      .json({ errors: [{ message: 'DUFFEL_ACCESS_TOKEN is not configured on the server' }] })
    return
  }

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path' || value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, item)
  }
  // Avoid URLSearchParams.size (Node < 19.8) — stringify and check for content.
  const queryString = search.toString()
  const query = queryString ? `?${queryString}` : ''

  try {
    // Client headers are deliberately not forwarded; the upstream request is
    // built from scratch with the server-held token.
    const upstream = await fetch(`${DUFFEL_BASE}/${path}${query}`, {
      method: route.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        ...(route.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: route.method === 'POST' ? JSON.stringify(req.body) : undefined,
    })
    const body = await upstream.text()
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    // Duffel's status and error envelope are passed through verbatim so the
    // frontend deals with a single error shape in dev and production.
    res.status(upstream.status).send(body)
  } catch {
    res.status(502).json({ errors: [{ message: 'Could not reach the Duffel API' }] })
  }
}
