import axios from 'axios';
import http from 'http';
import 'dotenv/config';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:3002'}/api/auth`;
const TIMEOUT = 120000;

const httpAgent = new http.Agent({ keepAlive: false });

export const errorTests = [
  {
    name: 'POST /login - 401 (credentials salah)',
    method: 'POST',
    url: `${BASE_URL}/login`,
    data: {
      identifier: 'admin@pnp.ac.id',
      password: 'wrongpassword'
    },
    expectedStatus: 401
  },
  {
    name: 'POST /login - 400 (field tidak lengkap)',
    method: 'POST',
    url: `${BASE_URL}/login`,
    data: {
      identifier: 'admin@pnp.ac.id'
    },
    expectedStatus: 400
  },
  {
    name: 'GET /me - 401 (no token)',
    method: 'GET',
    url: `${BASE_URL}/me`,
    expectedStatus: 401
  }
];

export async function testAuthError(): Promise<{ passed: number; failed: number; hangs: number }> {
  console.log('🎯 Testing Auth ERROR scenarios...\n');
  
  let passed = 0, failed = 0, hangs = 0;
  
  for (const test of errorTests) {
    console.log(`\n📝 ${test.name}`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: test.method as any,
        url: test.url,
        data: test.data,
        timeout: TIMEOUT,
        httpAgent,
        validateStatus: () => true
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ ${duration}ms - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`   ⚠️  ${duration}ms - Expected ${test.expectedStatus}, got ${response.status}`);
        failed++;
      }
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        console.log(`   🚨 HANG DETECTED! TIMEOUT after ${duration}ms`);
        hangs++;
      } else {
        console.log(`   ❌ ${duration}ms - Error: ${error.message}`);
        failed++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${hangs} hangs`);
  console.log('='.repeat(60));
  
  return { passed, failed, hangs };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthError()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
