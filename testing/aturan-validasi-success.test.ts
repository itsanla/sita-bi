import axios from 'axios';
import http from 'http';
import 'dotenv/config';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:3002'}/api/aturan-validasi`;

const httpAgent = new http.Agent({ keepAlive: false });

export const successTests = [
  {
    name: 'GET / - Get aturan validasi',
    roles: ['admin', 'dosen', 'jurusan', 'prodi_d3', 'prodi_d4', 'mahasiswa'],
    method: 'GET',
    url: BASE_URL,
    expectedStatus: 200
  },
  {
    name: 'PUT / - Update aturan validasi',
    roles: ['jurusan'],
    method: 'PUT',
    url: BASE_URL,
    data: {
      mode_validasi_judul: 'KEDUA_PEMBIMBING',
      mode_validasi_draf: 'SALAH_SATU'
    },
    expectedStatus: 200
  }
];

export async function testAturanValidasiSuccess(): Promise<{ passed: number; failed: number; hangs: number }> {
  console.log('🎯 Testing Aturan Validasi SUCCESS scenarios...\n');
  
  let passed = 0, failed = 0, hangs = 0;
  
  for (const test of successTests) {
    console.log(`\n📝 ${test.name}`);
    console.log(`   Roles: ${test.roles.join(', ')}`);
    
    for (const role of test.roles) {
      const token = process.env[`JWT_TOKEN_${role.toUpperCase()}`];
      
      if (!token || token === 'invalid' || token === 'skip-for-now') {
        console.log(`   ⏭️  ${role} - No valid token`);
        continue;
      }
      
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const startTime = Date.now();
      
      try {
        const response = await axios({
          method: test.method as any,
          url: test.url,
          data: test.data,
          headers,
          
          httpAgent
        });
        
        const duration = Date.now() - startTime;
        
        if (response.status === test.expectedStatus) {
          console.log(`   ✅ ${role} - ${duration}ms - Status: ${response.status}`);
          passed++;
        } else {
          console.log(`   ⚠️  ${role} - ${duration}ms - Expected ${test.expectedStatus}, got ${response.status}`);
          failed++;
        }
        
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error.code === 'ECONNABORTED') {
          console.log(`   🚨 ${role} - HANG DETECTED! TIMEOUT after ${duration}ms`);
          hangs++;
        } else {
          console.log(`   ❌ ${role} - ${duration}ms - Error: ${error.response?.status || error.message}`);
          failed++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${hangs} hangs`);
  console.log('='.repeat(60));
  
  return { passed, failed, hangs };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAturanValidasiSuccess()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
