import 'dotenv/config';
import { testBimbinganSuccess } from './bimbingan-success.test';
import { testBimbinganError } from './bimbingan-error.test';
import { testAturanValidasiSuccess } from './aturan-validasi-success.test';
import { testAturanValidasiError } from './aturan-validasi-error.test';
import { testAuthSuccess } from './auth-success.test';
import { testAuthError } from './auth-error.test';

// Import test counts
import { successTests as bimbinganSuccessTests } from './bimbingan-success.test';
import { errorTests as bimbinganErrorTests } from './bimbingan-error.test';
import { successTests as aturanSuccessTests } from './aturan-validasi-success.test';
import { errorTests as aturanErrorTests } from './aturan-validasi-error.test';
import { successTests as authSuccessTests } from './auth-success.test';
import { errorTests as authErrorTests } from './auth-error.test';
import { getSkippedCount } from './skipped-endpoints';

async function runAllTests() {
  console.log('🚀 Starting comprehensive API stress test...\n');
  
  // Test Bimbingan
  console.log('📚 Testing BIMBINGAN endpoints...');
  const bimbinganSuccess = await testBimbinganSuccess();
  const bimbinganError = await testBimbinganError();
  
  // Test Aturan Validasi
  console.log('\n' + '='.repeat(60));
  console.log('📚 Testing ATURAN VALIDASI endpoints...');
  console.log('='.repeat(60) + '\n');
  const aturanSuccess = await testAturanValidasiSuccess();
  const aturanError = await testAturanValidasiError();
  
  // Test Auth
  console.log('\n' + '='.repeat(60));
  console.log('📚 Testing AUTH endpoints...');
  console.log('='.repeat(60) + '\n');
  const authSuccess = await testAuthSuccess();
  const authError = await testAuthError();
  
  // Combine results
  const successResult = {
    passed: bimbinganSuccess.passed + aturanSuccess.passed + authSuccess.passed,
    failed: bimbinganSuccess.failed + aturanSuccess.failed + authSuccess.failed,
    hangs: bimbinganSuccess.hangs + aturanSuccess.hangs + authSuccess.hangs
  };
  
  const errorResult = {
    passed: bimbinganError.passed + aturanError.passed + authError.passed,
    failed: bimbinganError.failed + aturanError.failed + authError.failed,
    hangs: bimbinganError.hangs + aturanError.hangs + authError.hangs
  };
  
  const totalPassed = successResult.passed + errorResult.passed;
  const totalFailed = successResult.failed + errorResult.failed;
  const totalHangs = successResult.hangs + errorResult.hangs;
  const totalTests = totalPassed + totalFailed + totalHangs;
  
  // Count unique endpoints
  const getEndpointPath = (url: string) => {
    const urlObj = new URL(url);
    return urlObj.pathname.replace(/\/\d+/g, '/:id');
  };
  
  const allSuccessTests = [...bimbinganSuccessTests, ...aturanSuccessTests, ...authSuccessTests];
  const allErrorTests = [...bimbinganErrorTests, ...aturanErrorTests, ...authErrorTests];
  
  const successEndpoints = new Set(allSuccessTests.map(t => getEndpointPath(t.url)));
  const errorEndpoints = new Set(allErrorTests.map(t => getEndpointPath(t.url)));
  const allEndpoints = new Set([...successEndpoints, ...errorEndpoints]);
  
  const totalScenarios = allSuccessTests.length + allErrorTests.length;
  const skippedCount = getSkippedCount();
  const totalEndpoints = allEndpoints.size + skippedCount;
  
  // Count endpoints per service
  const bimbinganEndpoints = new Set([...bimbinganSuccessTests, ...bimbinganErrorTests].map(t => getEndpointPath(t.url)));
  const aturanEndpoints = new Set([...aturanSuccessTests, ...aturanErrorTests].map(t => getEndpointPath(t.url)));
  const authEndpoints = new Set([...authSuccessTests, ...authErrorTests].map(t => getEndpointPath(t.url)));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`🎯 Total API Endpoints: ${totalEndpoints}`);
  console.log(`   - Bimbingan: ${bimbinganEndpoints.size} endpoints`);
  console.log(`   - Aturan Validasi: ${aturanEndpoints.size} endpoints`);
  console.log(`   - Auth: ${authEndpoints.size} endpoints`);
  console.log(`   - Skipped: ${skippedCount} endpoints (run 'pnpm run detail:skip' for details)`);
  console.log(`📝 Test Scenarios: ${totalScenarios} (Success: ${allSuccessTests.length}, Error: ${allErrorTests.length})`);
  console.log(`🔄 Total Test Executions: ${totalTests} (with multiple roles)`);
  console.log('');
  console.log(`✅ Total Passed: ${totalPassed} (Success: ${successResult.passed}, Error: ${errorResult.passed})`);
  console.log(`❌ Total Failed: ${totalFailed} (Success: ${successResult.failed}, Error: ${errorResult.failed})`);
  console.log(`🚨 Total Hangs: ${totalHangs} (Success: ${successResult.hangs}, Error: ${errorResult.hangs})`);
  console.log('');
  console.log(`📈 Coverage: ${allEndpoints.size}/${totalEndpoints} endpoints (${Math.round(allEndpoints.size/totalEndpoints*100)}%)`);
  
  if (totalHangs > 0) {
    console.log('\n🚨 HANG DETECTED! Check logs above for details.');
    process.exit(1);
  }
  
  console.log('\n✅ All tests completed successfully!');
  process.exit(0);
}

runAllTests().catch(console.error);
