import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Fetching sites...")
  const { data: sites, error: fetchError } = await supabase.from('sites').select('*')
  if (fetchError) {
    console.error("Fetch error:", fetchError)
    return
  }
  console.log("Sites:", sites.map(s => ({id: s.id, name: s.name})))
  
  if (sites.length > 0) {
    console.log("Attempting to delete site:", sites[0].name, sites[0].id)
    const { data, error } = await supabase.from('sites').delete().eq('id', sites[0].id).select()
    console.log("Delete result:", { data, error })
  }
}

test()
