const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Testing referred_by...');
  try {
    const { error: err1 } = await supabase.from('patients').insert([{
      name: 'Test Referred By',
      email: 'ref_by_test@test.com',
      referred_by: 'iitknitin06@gmail.com'
    }]);
    console.log('referred_by insert result:', err1 ? err1.message : 'SUCCESS');
    if (!err1) await supabase.from('patients').delete().eq('email', 'ref_by_test@test.com');
  } catch (e) {
    console.error('referred_by caught error:', e);
  }

  console.log('Testing referred_id...');
  try {
    const { error: err2 } = await supabase.from('patients').insert([{
      name: 'Test Referred Id',
      email: 'ref_id_test@test.com',
      referred_id: 'iitknitin06@gmail.com'
    }]);
    console.log('referred_id insert result:', err2 ? err2.message : 'SUCCESS');
    if (!err2) await supabase.from('patients').delete().eq('email', 'ref_id_test@test.com');
  } catch (e) {
    console.error('referred_id caught error:', e);
  }
}

main();
