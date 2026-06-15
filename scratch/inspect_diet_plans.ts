import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function inspectDietPlans() {
  console.log('Fetching OpenAPI schema from PostgREST...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': supabaseKey }
    });
    const schema = await response.json();
    if (schema.definitions && schema.definitions.wombcare_diet_plans) {
      console.log('\n--- wombcare_diet_plans definition ---');
      console.log(JSON.stringify(schema.definitions.wombcare_diet_plans, null, 2));
    } else {
      console.log('wombcare_diet_plans definition not found.');
    }
  } catch (e: any) {
    console.error('Failed to load schema:', e.message);
  }
}

inspectDietPlans();
