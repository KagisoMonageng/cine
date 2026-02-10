const { Pool } = require('pg')
const env = require('./env')

if (!env.databaseUrl) {
  throw new Error('Missing DATABASE_URL in environment')
}

const sslConfig = env.nodeEnv === 'production'
  ? { rejectUnauthorized: false }
  : false

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: sslConfig
})

module.exports = pool
