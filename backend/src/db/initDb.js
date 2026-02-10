const fs = require('fs')
const path = require('path')
const pool = require('../config/db')

async function main () {
  const sqlPath = path.resolve(__dirname, '../../sql/schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  await pool.query(sql)
  console.log('Database schema initialized successfully.')
}

main()
  .catch((error) => {
    console.error('Failed to initialize database schema', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
