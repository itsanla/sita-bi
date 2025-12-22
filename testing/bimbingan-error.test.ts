import axios from 'axios';
import http from 'http';
import 'dotenv/config';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:3002'}/api/bimbingan`;

const httpAgent = new http.Agent({ keepAlive: false });
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Test cases untuk error scenarios
export const errorTests = [
  {
    name: 'GET /sebagai-dosen - 400 (mahasiswa tidak punya profil dosen)',
    roles: ['mahasiswa'],
    method: 'GET',
    url: `${BASE_URL}/sebagai-dosen`,
    expectedStatus: 400
  },
  {
    name: 'GET /sebagai-mahasiswa - 400 (dosen tidak punya profil mahasiswa)',
    roles: ['dosen', 'jurusan', 'prodi_d3', 'prodi_d4', 'admin'],
    method: 'GET',
    url: `${BASE_URL}/sebagai-mahasiswa`,
    expectedStatus: 400
  },
  {
    name: 'POST /catatan - 404 (bimbingan_ta_id tidak ada)',
    roles: ['dosen', 'mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/catatan`,
    data: { bimbingan_ta_id: 99999, catatan: 'Test catatan' },
    expectedStatus: 404
  },
  {
    name: 'POST /sesi - 401 (role tidak diizinkan)',
    roles: ['admin', 'jurusan', 'prodi_d3', 'prodi_d4'],
    method: 'POST',
    url: `${BASE_URL}/sesi`,
    data: { tugas_akhir_id: 1, pembimbing_peran: 'pembimbing1' },
    expectedStatus: 401
  },
  {
    name: 'PUT /sesi/:id/jadwal - 404 (sesi tidak ada)',
    roles: ['dosen', 'mahasiswa'],
    method: 'PUT',
    url: `${BASE_URL}/sesi/99999/jadwal`,
    data: { 
      tanggal_bimbingan: new Date().toISOString().split('T')[0],
      jam_bimbingan: '09:00',
      jam_selesai: '10:00'
    },
    expectedStatus: 404
  },
  {
    name: 'POST /sesi/:id/konfirmasi - 403 (mahasiswa tidak boleh konfirmasi)',
    roles: ['mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/konfirmasi`,
    expectedStatus: 403
  },
  {
    name: 'POST /sesi/:id/konfirmasi - 404 (sesi tidak ada)',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/sesi/99999/konfirmasi`,
    expectedStatus: 404
  },
  {
    name: 'POST /:tugasAkhirId/jadwal - 403 (mahasiswa tidak boleh)',
    roles: ['mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/1/jadwal`,
    data: { tanggal_bimbingan: new Date().toISOString().split('T')[0], jam_bimbingan: '10:00' },
    expectedStatus: 403
  },
  {
    name: 'POST /sesi/:id/cancel - 403 (mahasiswa tidak boleh cancel)',
    roles: ['mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/cancel`,
    expectedStatus: 403
  },
  {
    name: 'POST /sesi/:id/cancel - 404 (sesi tidak ada)',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/sesi/99999/cancel`,
    expectedStatus: 404
  },
  {
    name: 'GET /conflicts - 403 (mahasiswa tidak boleh)',
    roles: ['mahasiswa'],
    method: 'GET',
    url: `${BASE_URL}/conflicts?tanggal=${new Date().toISOString().split('T')[0]}&jam=09:00`,
    expectedStatus: 403
  },
  {
    name: 'GET /conflicts - 400 (parameter tidak lengkap)',
    roles: ['dosen'],
    method: 'GET',
    url: `${BASE_URL}/conflicts`,
    expectedStatus: 400
  },
  {
    name: 'GET /available-slots - 400 (parameter tidak lengkap)',
    roles: ['dosen'],
    method: 'GET',
    url: `${BASE_URL}/available-slots`,
    expectedStatus: 400
  },
  {
    name: 'DELETE /sesi/:id - 404 (sesi tidak ada)',
    roles: ['dosen', 'mahasiswa'],
    method: 'DELETE',
    url: `${BASE_URL}/sesi/99999`,
    expectedStatus: 404
  },
  {
    name: 'GET /eligibility/:tugasAkhirId - 403 (dosen tidak boleh)',
    roles: ['dosen', 'jurusan', 'prodi_d3', 'prodi_d4'],
    method: 'GET',
    url: `${BASE_URL}/eligibility/1`,
    expectedStatus: 403
  },
  {
    name: 'POST /sesi/:id/batalkan-validasi - 403 (mahasiswa tidak boleh)',
    roles: ['mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/batalkan-validasi`,
    expectedStatus: 403
  },
  {
    name: 'POST /sesi/:id/batalkan-validasi - 404 (sesi tidak ada)',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/sesi/99999/batalkan-validasi`,
    expectedStatus: 404
  }
];

export async function testBimbinganError(): Promise<{ passed: number; failed: number; hangs: number }> {
  console.log('🎯 Testing Bimbingan ERROR scenarios with all roles...\n');
  
  let passed = 0, failed = 0, hangs = 0;
  
  for (const test of errorTests) {
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
            timeout: REQUEST_TIMEOUT,
          url: test.url,
          data: test.data,
          headers,
          
          httpAgent,
          validateStatus: () => true
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
          console.log(`   ❌ ${role} - ${duration}ms - Error: ${error.message}`);
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
  testBimbinganError()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
