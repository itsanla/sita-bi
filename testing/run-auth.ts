import 'dotenv/config';
import { testAuthSuccess } from './auth-success.test';
import { testAuthError } from './auth-error.test';

async function runAuthTests() {
  console.log('🚀 Testing Auth endpoints...\n');
  
  const successResult = await testAuthSuccess();
  
  console.log('\n' + '='.repeat(60));
  console.log('Starting ERROR scenarios...');
  console.log('='.repeat(60) + '\n');
  
  const errorResult = await testAuthError();
  
  const totalPassed = successResult.passed + errorResult.passed;
  const totalFailed = successResult.failed + errorResult.failed;
  const totalHangs = successResult.hangs + errorResult.hangs;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`🎯 Endpoints: 7 (tested: 3 core endpoints)`);
  console.log(`✅ Total Passed: ${totalPassed} (Success: ${successResult.passed}, Error: ${errorResult.passed})`);
  console.log(`❌ Total Failed: ${totalFailed} (Success: ${successResult.failed}, Error: ${errorResult.failed})`);
  console.log(`🚨 Total Hangs: ${totalHangs}`);
  
  if (totalHangs > 0) {
    console.log('\n🚨 HANG DETECTED!');
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed!');
}

runAuthTests().catch(console.error);
