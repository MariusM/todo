import express from 'express'
import { initDatabase } from './db/init.js'
import { healthRoutes } from './routes/health-routes.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()
const PORT = process.env.PORT || 3001

const db = initDatabase()

app.use(express.json())
app.use(healthRoutes)
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export { app, db }
