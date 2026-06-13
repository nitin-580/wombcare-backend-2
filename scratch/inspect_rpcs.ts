import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function inspectRPCs() {
  console.log('Fetching OpenAPI schema paths...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': supabaseKey }
    });
    const schema = await response.json();
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log('Available RPC paths:');
    console.log(rpcs);
  } catch (e: any) {
    console.error('Failed:', e.message);
  }
}

inspectRPCs();
