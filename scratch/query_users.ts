import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- FETCHING ONE ROW FROM users TABLE ---');
  const { data: users, error: err1 } = await supabase.from('users').select('*').limit(1);
  if (err1) {
    console.error('Error users:', err1);
    return;
  }
  console.log('Sample user row:', users[0]);
}

run();
