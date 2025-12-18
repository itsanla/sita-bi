import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import http from 'http';
import 'dotenv/config';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:3002'}/api/bimbingan`;
const TIMEOUT = 120000;

const httpAgent = new http.Agent({ keepAlive: false });

// Test cases dengan role yang sesuai
export const successTests = [
  {
    name: 'GET /sebagai-dosen',
    roles: ['dosen', 'jurusan', 'prodi_d3', 'prodi_d4'],
    method: 'GET',
    url: `${BASE_URL}/sebagai-dosen?page=1&limit=10`,
    expectedStatus: 200
  },
  {
    name: 'GET /sebagai-mahasiswa',
    roles: ['mahasiswa'],
    method: 'GET',
    url: `${BASE_URL}/sebagai-mahasiswa`,
    expectedStatus: 200
  },
  {
    name: 'GET /conflicts',
    roles: ['dosen', 'jurusan', 'prodi_d3', 'prodi_d4'],
    method: 'GET',
    url: `${BASE_URL}/conflicts?tanggal=${new Date().toISOString().split('T')[0]}&jam=09:00`,
    expectedStatus: 200
  },
  {
    name: 'GET /available-slots',
    roles: ['dosen', 'jurusan', 'prodi_d3', 'prodi_d4'],
    method: 'GET',
    url: `${BASE_URL}/available-slots?tanggal=${new Date().toISOString().split('T')[0]}`,
    expectedStatus: 200
  },
  {
    name: 'GET /eligibility/:tugasAkhirId',
    roles: ['mahasiswa'],
    method: 'GET',
    url: `${BASE_URL}/eligibility/1`,
    expectedStatus: 200
  },
  {
    name: 'POST /sesi - CREATE',
    roles: ['dosen', 'mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/sesi`,
    data: { tugas_akhir_id: 1, pembimbing_peran: 'pembimbing1' },
    expectedStatus: 201
  },
  {
    name: 'POST /catatan - CREATE',
    roles: ['dosen', 'mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/catatan`,
    data: { bimbingan_ta_id: 1, catatan: 'Test catatan bimbingan' },
    expectedStatus: 201
  },
  {
    name: 'POST /sesi/:id/upload - FILE UPLOAD',
    roles: ['dosen', 'mahasiswa'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/upload`,
    isFileUpload: true,
    expectedStatus: 201
  },
  {
    name: 'PUT /sesi/:id/jadwal - UPDATE',
    roles: ['dosen', 'mahasiswa'],
    method: 'PUT',
    url: `${BASE_URL}/sesi/1/jadwal`,
    data: {
      tanggal_bimbingan: new Date().toISOString().split('T')[0],
      jam_bimbingan: '09:00',
      jam_selesai: '10:00'
    },
    expectedStatus: 200
  },
  {
    name: 'POST /:tugasAkhirId/jadwal - CREATE',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/1/jadwal`,
    data: {
      tanggal_bimbingan: new Date().toISOString().split('T')[0],
      jam_bimbingan: '10:00'
    },
    expectedStatus: 201
  },
  {
    name: 'POST /sesi/:id/selesaikan',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/selesaikan`,
    expectedStatus: 200
  },
  {
    name: 'POST /sesi/:id/cancel',
    roles: ['dosen'],
    method: 'POST',
    url: `${BASE_URL}/sesi/1/cancel`,
    expectedStatus: 200
  }
];

export async function testBimbinganSuccess(): Promise<{ passed: number; failed: number; hangs: number }> {
  console.log('🎯 Testing Bimbingan SUCCESS scenarios with all roles...\n');
  
  let passed = 0, failed = 0, hangs = 0;
  
  for (const test of successTests) {
    console.log(`\n📝 ${test.name}`);
    console.log(`   Roles: ${test.roles.join(', ')}`);
    
    // Test dengan setiap role yang sesuai
    for (const role of test.roles) {
      const token = process.env[`JWT_TOKEN_${role.toUpperCase()}`];
      
      if (!token || token === 'invalid' || token === 'skip-for-now') {
        console.log(`   ⏭️  ${role} - No valid token`);
        continue;
      }
      
      const startTime = Date.now();
      
      try {
        let response;
        
        // Handle file upload
        if (test.isFileUpload) {
          const formData = new FormData();
          const filePath = path.join(process.cwd(), 'upload.pdf');
          
          if (!fs.existsSync(filePath)) {
            console.log(`   ⏭️  ${role} - File upload.pdf not found`);
            continue;
          }
          
          formData.append('files', fs.createReadStream(filePath));
          
          response = await axios({
            method: test.method as any,
            url: test.url,
            data: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
              ...formData.getHeaders()
            },
            timeout: TIMEOUT,
            httpAgent
          });
        } else {
          // Regular request
          const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
          response = await axios({
            method: test.method as any,
            url: test.url,
            data: test.data,
            headers,
            timeout: TIMEOUT,
            httpAgent
          });
        }
        
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
  testBimbinganSuccess()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
