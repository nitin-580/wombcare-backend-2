import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  console.log('--- FETCHING ALL USER ROLES OF TYPE DOCTOR ---');
  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('*')
    .eq('role', 'doctor');
    
  if (rolesErr) {
    console.error('Error fetching user roles:', rolesErr);
    return;
  }
  console.log('Roles:', roles);

  const emails = (roles || []).map(r => r.email);
  console.log('\n--- FETCHING DOCTOR PROFILES ---');
  const { data: docs, error: docsErr } = await supabase
    .from('users')
    .select('id, name, email, referral_code')
    .in('email', emails);
    
  if (docsErr) {
    console.error('Error fetching doctors:', docsErr);
    return;
  }
  console.log('Doctors:', docs);

  console.log('\n--- FETCHING ALL RECORDS IN WOMBCARE_DOCTOR_EARNINGS ---');
  const { data: earnings, error: earnErr } = await supabase
    .from('wombcare_doctor_earnings')
    .select('*');
    
  if (earnErr) {
    console.error('Error fetching earnings:', earnErr);
    return;
  }
  console.log('Earnings:', earnings);
}

inspectData();
