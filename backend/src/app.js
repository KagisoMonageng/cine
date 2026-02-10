const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const swaggerUi = require('swagger-ui-express')
const env = require('./config/env')
const authRoutes = require('./routes/authRoutes')
const bursaryRoutes = require('./routes/bursaryRoutes')
const applicationRoutes = require('./routes/applicationRoutes')
const profileRoutes = require('./routes/profileRoutes')
const socialRoutes = require('./routes/socialRoutes')
const errorHandler = require('./middleware/errorHandler')
const openApiSpec = require('./docs/openapi')

const app = express()

app.use(helmet())
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

app.use(
  '/api',
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/docs/openapi.json', (req, res) => {
  res.json(openApiSpec)
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  explorer: true
}))

app.use('/api/auth', authRoutes)
app.use('/api/bursaries', bursaryRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/social', socialRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

module.exports = app
