import express from 'express'
import { initDatabase } from './db/init.js'
import { createQueries } from './db/queries.js'
import { healthRoutes } from './routes/health-routes.js'
import { createTodoRoutes } from './routes/todo-routes.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()
const PORT = process.env.PORT || 3001

const db = initDatabase(process.env.NODE_ENV === 'test' ? ':memory:' : undefined)
const queries = createQueries(db)

app.use(express.json())
app.use(healthRoutes)
app.use(createTodoRoutes(queries))
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export { app, db }
