import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying for iitknitin06@gmail.com in users table...');
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'iitknitin06@gmail.com');
  console.log('User data:', userData, 'Error:', userErr);

  console.log('Querying for user_roles...');
  const { data: roleData, error: roleErr } = await supabase
    .from('user_roles')
    .select('*');
  console.log('All User Roles:', roleData, 'Error:', roleErr);
}

main().catch(console.error);
