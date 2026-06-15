import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching users from early_access_users...');
  const { data: users, error: err1 } = await supabase.from('early_access_users').select('*');
  if (err1) {
    console.error('Error early_access_users:', err1);
    return;
  }
  console.log('Total early access users:', users.length);
  console.log('Sample users:', users.slice(0, 3));

  console.log('\nFetching from user_roles...');
  const { data: roles, error: err2 } = await supabase.from('user_roles').select('*');
  if (err2) {
    console.error('Error user_roles:', err2);
    return;
  }
  console.log('Total roles in user_roles:', roles.length);
  console.log('Roles:', roles);
}

run();
