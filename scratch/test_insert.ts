import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const doctorId = '75d1d6a8-bf9b-432d-88f5-937b8ea79d57'; // Let's get an actual doctor ID if possible, or try any ID
  
  // First, get a doctor id from database to test
  const { data: docData } = await supabase.from('users').select('id').limit(1);
  const testDocId = docData && docData[0] ? docData[0].id : doctorId;
  
  console.log('Testing doc ID:', testDocId);

  const statusesToTest = ['processed', 'transferred', 'withdrawn', 'pending'];
  
  for (const status of statusesToTest) {
    console.log(`\nTesting status: "${status}"`);
    const { data, error } = await supabase
      .from('wombcare_doctor_earnings')
      .insert({
        doctor_id: testDocId,
        amount: 100,
        status: status,
        description: `Test insert for status: ${status}`,
        date: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.log(`❌ Failed for "${status}":`, error.message);
    } else {
      console.log(`✅ Succeeded for "${status}"! (ID: ${data[0].id})`);
      // Clean up
      await supabase.from('wombcare_doctor_earnings').delete().eq('id', data[0].id);
    }
  }
}

testInsert();
