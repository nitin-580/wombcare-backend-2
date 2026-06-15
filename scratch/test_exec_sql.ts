import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('Testing wombcare_diet_plans pdf_url column...');
  try {
    const { data, error } = await supabase.from('wombcare_diet_plans').select('pdf_url').limit(1);
    if (error) {
      console.error('wombcare_diet_plans pdf_url Error:', error.message);
    } else {
      console.log('wombcare_diet_plans pdf_url Success:', data);
    }
  } catch (err) {
    console.error('wombcare_diet_plans pdf_url catch:', err);
  }
}

testTables();
