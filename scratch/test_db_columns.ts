import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
  console.log('Testing updating users table with bank details...');
  const { data, error } = await supabase
    .from('users')
    .update({
      bank_name: 'Test Bank',
      account_number: '1234567890',
      ifsc_code: 'TEST0123456'
    } as any)
    .eq('email', 'kumar.aashirvad@gmail.com')
    .select();

  if (error) {
    console.log('Update failed:', error.message);
  } else {
    console.log('Update succeeded! Columns exist in users table.', data);
  }
}

testColumns();
