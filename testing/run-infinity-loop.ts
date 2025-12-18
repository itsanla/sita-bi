import 'dotenv/config';
import { testBimbinganSuccess } from './bimbingan-success.test';
import { testBimbinganError } from './bimbingan-error.test';
import { testAturanValidasiSuccess } from './aturan-validasi-success.test';
import { testAturanValidasiError } from './aturan-validasi-error.test';
import { testAuthSuccess } from './auth-success.test';
import { testAuthError } from './auth-error.test';

async function runInfinityLoop() {
  console.log('🔄 Starting INFINITY LOOP stress test...');
  console.log('⚠️  This will run until HANG detected or manually stopped (Ctrl+C)\n');
  
  let cycle = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalHangs = 0;
  
  const startTime = Date.now();
  
  while (true) {
    cycle++;
    const cycleStart = Date.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 CYCLE ${cycle} - ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    try {
      // Test all modules
      console.log('\n✅ Running SUCCESS tests...');
      const bimbinganSuccess = await testBimbinganSuccess();
      const aturanSuccess = await testAturanValidasiSuccess();
      const authSuccess = await testAuthSuccess();
      
      console.log('\n❌ Running ERROR tests...');
      const bimbinganError = await testBimbinganError();
      const aturanError = await testAturanValidasiError();
      const authError = await testAuthError();
      
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
      
      // Accumulate results
      totalPassed += successResult.passed + errorResult.passed;
      totalFailed += successResult.failed + errorResult.failed;
      totalHangs += successResult.hangs + errorResult.hangs;
      
      const cycleDuration = Date.now() - cycleStart;
      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 CYCLE ${cycle} SUMMARY`);
      console.log('='.repeat(60));
      console.log(`⏱️  Cycle Duration: ${cycleDuration}ms`);
      console.log(`⏱️  Total Runtime: ${totalDuration}s`);
      console.log(`✅ Cycle Passed: ${successResult.passed + errorResult.passed}`);
      console.log(`❌ Cycle Failed: ${successResult.failed + errorResult.failed}`);
      console.log(`🚨 Cycle Hangs: ${successResult.hangs + errorResult.hangs}`);
      console.log(`\n📈 CUMULATIVE STATS:`);
      console.log(`   Total Passed: ${totalPassed}`);
      console.log(`   Total Failed: ${totalFailed}`);
      console.log(`   Total Hangs: ${totalHangs}`);
      console.log(`   Total Cycles: ${cycle}`);
      
      // Check for hang
      if (successResult.hangs > 0 || errorResult.hangs > 0) {
        console.log('\n🚨 HANG DETECTED! Stopping infinity loop...');
        console.log(`Hang occurred at cycle ${cycle} after ${totalDuration}s`);
        process.exit(1);
      }
      
      // Delay antar cycle (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`\n❌ Error in cycle ${cycle}:`, error);
      console.log('Continuing to next cycle...');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Infinity loop stopped by user (Ctrl+C)');
  console.log('Exiting...');
  process.exit(0);
});

runInfinityLoop().catch(console.error);
