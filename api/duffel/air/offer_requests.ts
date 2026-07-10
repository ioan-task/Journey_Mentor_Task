import type { VercelRequest, VercelResponse } from '@vercel/node'

const DUFFEL_BASE = 'https://api.duffel.com'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ errors: [{ message: `${req.method} is not allowed` }] })
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
    if (value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, item)
  }
  const queryString = search.toString()
  const query = queryString ? `?${queryString}` : ''

  try {
    const upstream = await fetch(`${DUFFEL_BASE}/air/offer_requests${query}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })
    const body = await upstream.text()
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    res.status(upstream.status).send(body)
  } catch {
    res.status(502).json({ errors: [{ message: 'Could not reach the Duffel API' }] })
  }
}
