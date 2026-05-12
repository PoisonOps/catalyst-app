const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const config = fs.readFileSync('/Users/poison/Desktop/CATalyst/js/config.js', 'utf-8');
const urls = [...config.matchAll(/SUPABASE_URL:\s*'([^']+)'/g)];
const keys = [...config.matchAll(/SUPABASE_KEY:\s*'([^']+)'/g)];

const supabasePROD = createClient(urls[0][1], keys[0][1]);
const supabaseDEV = createClient(urls[1][1], keys[1][1]);

async function syncTable(tableName) {
  console.log(`Fetching ${tableName} from PROD...`);
  // Handle pagination if there are many records
  let allData = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabasePROD.from(tableName).select('*').range(from, from + limit - 1);
    if (error) {
      console.error(`Error fetching ${tableName} from PROD:`, error.message);
      return;
    }
    allData = allData.concat(data);
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log(`Found ${allData.length} records in PROD ${tableName}. Upserting to DEV...`);
  
  // Upsert in chunks to avoid payload limits
  const chunkSize = 100;
  for (let i = 0; i < allData.length; i += chunkSize) {
    const chunk = allData.slice(i, i + chunkSize);
    const { error } = await supabaseDEV.from(tableName).upsert(chunk);
    if (error) {
      console.error(`\n❌ Error upserting ${tableName} into DEV:`, error.message);
      console.log(`Make sure you have manually added any new columns to DEV that exist in PROD!`);
      return;
    }
  }
  
  console.log(`✅ Successfully synced ${tableName} from PROD to DEV!\n`);
}

async function run() {
  // Sync sets first due to foreign key constraints in questions
  await syncTable('sets');
  await syncTable('questions');
}

run();
