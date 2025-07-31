// Test script to isolate which import is causing the TypeError
console.log('Starting import test...');

try {
  console.log('Testing Job type import...');
  const { Job } = await import('../src/contexts/JobContext');
  console.log('✓ Job type imported successfully');
} catch (error) {
  console.error('✗ Error importing Job type:', error);
  process.exit(1);
}

try {
  console.log('Testing xmlParser import...');
  const { fetchAndParseJobsXmlWithSources } = await import('../src/utils/xmlParser');
  console.log('✓ xmlParser imported successfully');
} catch (error) {
  console.error('✗ Error importing xmlParser:', error);
  process.exit(1);
}

try {
  console.log('Testing supabaseClient import...');
  const { getSupabaseClient } = await import('../src/utils/supabaseClient');
  console.log('✓ supabaseClient imported successfully');
  const supabase = getSupabaseClient();
  console.log('Supabase client status:', supabase ? 'initialized' : 'null');
} catch (error) {
  console.error('✗ Error importing supabaseClient:', error);
  process.exit(1);
}

console.log('All imports successful!');