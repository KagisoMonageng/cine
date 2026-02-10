const supabase = require('../config/db')

async function main () {
  console.log('Please run the SQL from sql/schema.sql in Supabase Dashboard SQL Editor')
  console.log('URL: https://supabase.com/dashboard/project/ovyzombqlkqpvlarhhpz/editor')
  console.log('\nVerifying tables exist...')
  
  const { error } = await supabase.from('users').select('id').limit(1)
  
  if (error) {
    console.log('Tables not found. Please create them in Supabase Dashboard.')
    process.exitCode = 1
    return
  }
  
  console.log('Database schema initialized successfully.')
}

main()
  .catch((error) => {
    console.error('Failed to initialize database schema', error)
    process.exitCode = 1
  })
