import http from 'http';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TOKEN = process.env.JWT_TOKEN_DOSEN || '';

console.log('🔥 Testing Connection Abuse - Simulating Mahasiswa Nakal\n');
console.log('Target:', BASE_URL);
console.log('Strategy: Open 50 connections WITHOUT closing them\n');

let successCount = 0;
let errorCount = 0;
let timeoutCount = 0;
let activeConnections = 0;

function makeHangingRequest(id: number): Promise<void> {
  return new Promise((resolve) => {
    const url = new URL('/api/bimbingan/sebagai-dosen', BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3002,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
      // TIDAK set agent, biarkan default (keep-alive)
    };

    const startTime = Date.now();
    activeConnections++;
    
    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        console.log(`✅ Request ${id}: Success in ${duration}ms`);
        successCount++;
      } else if (res.statusCode === 504) {
        console.log(`⏱️  Request ${id}: Timeout (504) in ${duration}ms`);
        timeoutCount++;
      } else {
        console.log(`⚠️  Request ${id}: Status ${res.statusCode} in ${duration}ms`);
        errorCount++;
      }
      
      // SENGAJA TIDAK CONSUME DATA - Biarkan connection hang
      // res.on('data', () => {}); // <-- Commented out
      
      res.on('end', () => {
        activeConnections--;
        resolve();
      });
      
      res.on('close', () => {
        activeConnections--;
        resolve();
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`❌ Request ${id}: Error in ${duration}ms - ${err.message}`);
      errorCount++;
      activeConnections--;
      resolve();
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`🚨 Request ${id}: Client timeout in ${duration}ms`);
      timeoutCount++;
      req.destroy();
      activeConnections--;
      resolve();
    });

    // Set client timeout 15 detik (lebih lama dari server)
    req.setTimeout(15000);
    
    // KIRIM REQUEST TAPI TIDAK END - Biarkan hanging
    // req.end(); // <-- Commented out to simulate hanging
    
    // Actually, we need to end to send the request, but we won't consume response
    req.end();
  });
}

async function runAbusiveTest() {
  console.log('Starting abusive test...\n');
  
  const promises: Promise<void>[] = [];
  
  // Kirim 50 request sekaligus tanpa menunggu
  for (let i = 1; i <= 50; i++) {
    promises.push(makeHangingRequest(i));
    
    // Small delay to see the pattern
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Monitor active connections
  const monitor = setInterval(() => {
    console.log(`\n📊 Active connections: ${activeConnections}`);
  }, 2000);
  
  // Wait for all requests to complete or timeout
  await Promise.all(promises);
  
  clearInterval(monitor);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ABUSE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏱️  Timeout (504): ${timeoutCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${successCount + timeoutCount + errorCount}/50`);
  console.log('');
  
  if (timeoutCount > 0) {
    console.log('✅ Backend handled hanging connections properly (sent 504)');
  }
  
  if (successCount === 50) {
    console.log('⚠️  All requests succeeded - backend might be vulnerable');
  }
  
  if (errorCount > 40) {
    console.log('❌ Too many errors - backend might be overloaded');
  }
  
  console.log('\n💡 Expected behavior:');
  console.log('   - Some requests succeed (fast ones)');
  console.log('   - Some get 504 timeout (backend protection working)');
  console.log('   - Backend stays responsive (not hang)');
  
  process.exit(0);
}

runAbusiveTest().catch(console.error);
