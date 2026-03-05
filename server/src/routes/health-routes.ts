import { Router } from 'express'

export const healthRoutes = Router()

healthRoutes.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
