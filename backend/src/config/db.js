const { createClient } = require('@supabase/supabase-js')
const env = require('./env')

if (!env.sup_url || !env.sup_anon) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment')
}

const supabase = createClient(env.sup_url, env.sup_anon)

module.exports = supabase
