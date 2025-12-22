import 'dotenv/config';
import { testBimbinganSuccess } from './bimbingan-success.test';
import { testBimbinganError } from './bimbingan-error.test';
import { testAturanValidasiSuccess } from './aturan-validasi-success.test';
import { testAturanValidasiError } from './aturan-validasi-error.test';
import { testAuthSuccess } from './auth-success.test';
import { testAuthError } from './auth-error.test';

const REQUEST_TIMEOUT = 30000; // 30 seconds for entire test suite
let startTime = 0;
let cycle = 0;
let totalApisTested = 0;

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]);
}

async function runInfinityLoop() {
  startTime = Date.now();
  const startDate = new Date();
  
  console.log('🔄 Starting INFINITY LOOP stress test...');
  console.log(`⏰ Start Time: ${startDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log('⚠️  This will run until HANG detected or manually stopped (Ctrl+C)\n');
  
  cycle = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalHangs = 0;
  totalApisTested = 0;
  
  while (true) {
    cycle++;
    const cycleStart = Date.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 CYCLE ${cycle} - ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    try {
      // Test all modules with timeout
      console.log('\n✅ Running SUCCESS tests...');
      const bimbinganSuccess = await withTimeout(testBimbinganSuccess(), REQUEST_TIMEOUT);
      const aturanSuccess = await withTimeout(testAturanValidasiSuccess(), REQUEST_TIMEOUT);
      const authSuccess = await withTimeout(testAuthSuccess(), REQUEST_TIMEOUT);
      
      console.log('\n❌ Running ERROR tests...');
      const bimbinganError = await withTimeout(testBimbinganError(), REQUEST_TIMEOUT);
      const aturanError = await withTimeout(testAturanValidasiError(), REQUEST_TIMEOUT);
      const authError = await withTimeout(testAuthError(), REQUEST_TIMEOUT);
      
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
      const cycleTotal = successResult.passed + successResult.failed + successResult.hangs + 
                         errorResult.passed + errorResult.failed + errorResult.hangs;
      totalApisTested += cycleTotal;
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
      console.log(`   Total APIs Tested: ${totalApisTested}`);
      console.log(`   Total Passed: ${totalPassed}`);
      console.log(`   Total Failed: ${totalFailed}`);
      console.log(`   Total Hangs: ${totalHangs}`);
      console.log(`   Total Cycles: ${cycle}`);
      
      // Check for hang
      if (successResult.hangs > 0 || errorResult.hangs > 0) {
        const endDate = new Date();
        const duration = Date.now() - startTime;
        console.log('\n🚨 HANG DETECTED! Stopping infinity loop...');
        console.log(`\n${'='.repeat(60)}`);
        console.log('🚨 INFINITY LOOP STOPPED - HANG DETECTED');
        console.log('='.repeat(60));
        console.log(`⏰ Start Time: ${new Date(startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
        console.log(`⏰ End Time: ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
        console.log(`⏱️  Duration: ${formatDuration(duration)}`);
        console.log(`🔄 Total Cycles: ${cycle}`);
        console.log(`📊 Total APIs Tested: ${totalApisTested}`);
        console.log('='.repeat(60));
        process.exit(1);
      }
      
      // Delay antar cycle (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      const endDate = new Date();
      const duration = Date.now() - startTime;
      
      if (error instanceof Error && error.message === 'TIMEOUT') {
        console.error(`\n🚨 HANG DETECTED! Request timeout after ${REQUEST_TIMEOUT}ms`);
        console.log(`\n${'='.repeat(60)}`);
        console.log('🚨 INFINITY LOOP STOPPED - HANG DETECTED');
        console.log('='.repeat(60));
        console.log(`⏰ Start Time: ${new Date(startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
        console.log(`⏰ End Time: ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
        console.log(`⏱️  Duration: ${formatDuration(duration)}`);
        console.log(`🔄 Total Cycles: ${cycle}`);
        console.log(`📊 Total APIs Tested: ${totalApisTested}`);
        console.log('='.repeat(60));
        process.exit(1);
      }
      
      console.error(`\n❌ Error in cycle ${cycle}:`, error);
      console.log('Continuing to next cycle...');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  const endDate = new Date();
  const duration = Date.now() - startTime;
  console.log('\n\n⚠️  Infinity loop stopped by user (Ctrl+C)');
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 INFINITY LOOP SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏰ Start Time: ${new Date(startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log(`⏰ End Time: ${endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log(`⏱️  Duration: ${formatDuration(duration)}`);
  console.log(`🔄 Total Cycles: ${cycle}`);
  console.log(`📊 Total APIs Tested: ${totalApisTested}`);
  console.log('='.repeat(60));
  console.log('Exiting...');
  process.exit(0);
});

runInfinityLoop().catch(console.error);
