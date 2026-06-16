import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('wombcare_classes')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching wombcare_classes:', error);
  } else {
    console.log('Fetched record keys:', data && data[0] ? Object.keys(data[0]) : 'No records found');
  }
}

run();
