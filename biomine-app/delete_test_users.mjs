import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Fetching all users from users table...");
  const { data: users, error: err1 } = await supabase.from('users').select('*');
  if (err1) {
    console.error("Error fetching users:", err1);
    return;
  }
  
  for (const u of users) {
    if (u.email.toLowerCase() !== 'k.shubhamchaubey@gmail.com') {
      console.log(`Deleting user ${u.email}...`);
      await supabase.from('user_roles').delete().eq('user_id', u.id);
      await supabase.from('site_assignments').delete().eq('user_id', u.id);
      await supabase.from('users').delete().eq('id', u.id);
    } else {
      console.log(`Keeping dev account ${u.email}`);
    }
  }

  console.log("Done clearing other users.");
}

run();
