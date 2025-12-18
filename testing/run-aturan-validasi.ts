import 'dotenv/config';
import { testAturanValidasiSuccess } from './aturan-validasi-success.test';
import { testAturanValidasiError } from './aturan-validasi-error.test';

async function runAturanValidasiTests() {
  console.log('🚀 Testing Aturan Validasi endpoints...\n');
  
  const successResult = await testAturanValidasiSuccess();
  
  console.log('\n' + '='.repeat(60));
  console.log('Starting ERROR scenarios...');
  console.log('='.repeat(60) + '\n');
  
  const errorResult = await testAturanValidasiError();
  
  const totalPassed = successResult.passed + errorResult.passed;
  const totalFailed = successResult.failed + errorResult.failed;
  const totalHangs = successResult.hangs + errorResult.hangs;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`🎯 Endpoints: 2`);
  console.log(`✅ Total Passed: ${totalPassed} (Success: ${successResult.passed}, Error: ${errorResult.passed})`);
  console.log(`❌ Total Failed: ${totalFailed} (Success: ${successResult.failed}, Error: ${errorResult.failed})`);
  console.log(`🚨 Total Hangs: ${totalHangs}`);
  
  if (totalHangs > 0) {
    console.log('\n🚨 HANG DETECTED!');
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed!');
}

runAturanValidasiTests().catch(console.error);
