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

async function inspectSchema() {
  console.log('Fetching schema columns from information_schema...');

  // Query columns for wombcare_doctor_earnings
  const { data: earningsCols, error: err1 } = await supabase
    .from('wombcare_doctor_earnings')
    .select('*')
    .limit(1);

  console.log('\n--- Columns of wombcare_doctor_earnings (via maybe inserting/fetching metadata) ---');
  if (err1) {
    console.error('Error querying wombcare_doctor_earnings:', err1);
  } else {
    console.log('Successfully queried wombcare_doctor_earnings');
  }

  // Let's run a raw sql using RPC if available, or try to insert a dummy row and rollback
  // Wait, let's query postgres information_schema via RPC if a custom function exists.
  // If not, we can try to guess or inspect.
  // Actually, we can check what fields supabaseAdapter maps:
  // doctor_id, appointment_id, amount, status, description, date, id, created_at
  // Let's try to fetch columns by running a query that returns columns.
  // In Supabase, if we do a POST/insert with empty object or look at PostgREST API docs, we can read the OpenAPI spec!
  // Yes! PostgREST serves an OpenAPI description of the database at the root URL!
  // Let's fetch the OpenAPI description of the Supabase API to get the exact database schema!
  // This is a brilliant way to inspect the DB schema.
  console.log('\nFetching OpenAPI schema from PostgREST...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
      }
    });
    const schema = await response.json();
    console.log('OpenAPI schema loaded.');
    if (schema.definitions) {
      console.log('\n--- wombcare_doctor_earnings definition ---');
      console.log(JSON.stringify(schema.definitions.wombcare_doctor_earnings, null, 2));

      console.log('\n--- users definition ---');
      console.log(JSON.stringify(schema.definitions.users, null, 2));
    } else {
      console.log('No definitions found in schema root.');
    }
  } catch (e: any) {
    console.error('Failed to load schema:', e.message);
  }
}

inspectSchema();
