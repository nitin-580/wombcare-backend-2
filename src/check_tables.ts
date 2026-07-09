import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying patients table sample...');
  const { data: patientData, error: pErr } = await supabase
    .from('patients')
    .select('*')
    .limit(1);
  console.log('Patient record sample:', patientData ? Object.keys(patientData[0] || {}) : 'No records', 'Error:', pErr);

  console.log('Querying referrals table sample...');
  const { data: refData, error: rErr } = await supabase
    .from('referrals')
    .select('*')
    .limit(1);
  console.log('Referral record sample:', refData ? Object.keys(refData[0] || {}) : 'No records', 'Error:', rErr);
}

main().catch(console.error);
