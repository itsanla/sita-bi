import axios from 'axios';
import 'dotenv/config';

const BASE_URL = `${process.env.BASE_URL || 'http://localhost:3000'}/api/bimbingan`;
const TIMEOUT = 120000; // 2 menit

// Mock data - sesuaikan dengan data valid di database
const MOCK_DATA = {
  tugasAkhirId: 1,
  sesiId: 1,
  dosenId: 1,
  mahasiswaId: 1,
  bimbinganTaId: 1
};

// Get JWT token berdasarkan role dari .env
const CURRENT_ROLE = process.env.TEST_ROLE || 'dosen';
const JWT_TOKEN = process.env[`JWT_TOKEN_${CURRENT_ROLE.toUpperCase()}`] || 'invalid-token';

console.log(`🔑 Testing as: ${CURRENT_ROLE.toUpperCase()}`);
console.log(`🔍 Token: ${JWT_TOKEN.substring(0, 50)}...`);
if (JWT_TOKEN === 'invalid-token') {
  console.warn('⚠️  Invalid token! Update .env file');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('JWT_TOKEN')));
}

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json'
};

export const bimbinganEndpoints = [
  {
    name: 'GET /sebagai-dosen',
    method: 'GET',
    url: `${BASE_URL}/sebagai-dosen?page=1&limit=10`,
    data: null
  },
  {
    name: 'GET /sebagai-mahasiswa', 
    method: 'GET',
    url: `${BASE_URL}/sebagai-mahasiswa`,
    data: null
  },
  {
    name: 'POST /catatan',
    method: 'POST',
    url: `${BASE_URL}/catatan`,
    data: {
      bimbingan_ta_id: MOCK_DATA.bimbinganTaId,
      catatan: 'Test catatan bimbingan'
    }
  },
  {
    name: 'POST /sesi/:id/upload',
    method: 'POST',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/upload`,
    data: null, // FormData untuk file upload
    isFileUpload: true
  },
  {
    name: 'POST /sesi',
    method: 'POST', 
    url: `${BASE_URL}/sesi`,
    data: {
      tugas_akhir_id: MOCK_DATA.tugasAkhirId,
      pembimbing_peran: 'pembimbing1'
    }
  },
  {
    name: 'PUT /sesi/:id/jadwal',
    method: 'PUT',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/jadwal`,
    data: {
      tanggal_bimbingan: new Date().toISOString().split('T')[0],
      jam_bimbingan: '09:00',
      jam_selesai: '10:00'
    }
  },
  {
    name: 'POST /sesi/:id/konfirmasi',
    method: 'POST',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/konfirmasi`,
    data: {}
  },
  {
    name: 'POST /:tugasAkhirId/jadwal',
    method: 'POST',
    url: `${BASE_URL}/${MOCK_DATA.tugasAkhirId}/jadwal`,
    data: {
      tanggal_bimbingan: new Date().toISOString().split('T')[0],
      jam_bimbingan: '10:00'
    }
  },
  {
    name: 'POST /sesi/:id/cancel',
    method: 'POST',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/cancel`,
    data: {}
  },
  {
    name: 'POST /sesi/:id/selesaikan',
    method: 'POST',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/selesaikan`,
    data: {}
  },
  {
    name: 'GET /conflicts',
    method: 'GET',
    url: `${BASE_URL}/conflicts?tanggal=${new Date().toISOString().split('T')[0]}&jam=09:00`,
    data: null
  },
  {
    name: 'GET /available-slots',
    method: 'GET',
    url: `${BASE_URL}/available-slots?tanggal=${new Date().toISOString().split('T')[0]}`,
    data: null
  },
  {
    name: 'DELETE /sesi/:id',
    method: 'DELETE',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}`,
    data: null
  },
  {
    name: 'GET /eligibility/:tugasAkhirId',
    method: 'GET',
    url: `${BASE_URL}/eligibility/${MOCK_DATA.tugasAkhirId}`,
    data: null
  },
  {
    name: 'POST /sesi/:id/batalkan-validasi',
    method: 'POST',
    url: `${BASE_URL}/sesi/${MOCK_DATA.sesiId}/batalkan-validasi`,
    data: {}
  }
];

export async function testBimbinganEndpoints(): Promise<void> {
  console.log('🧪 Testing Bimbingan Endpoints (15 total)...');
  
  for (let i = 0; i < bimbinganEndpoints.length; i++) {
    const test = bimbinganEndpoints[i];
    const startTime = Date.now();
    
    try {
      console.log(`⏳ [${i+1}/15] ${test.name}`);
      
      let requestConfig: any = {
        method: test.method,
        url: test.url,
        headers,
        timeout: TIMEOUT
      };

      if (test.isFileUpload) {
        // Skip file upload untuk testing sederhana
        console.log(`⏭️  Skipping file upload test: ${test.name}`);
        continue;
      } else if (test.data) {
        requestConfig.data = test.data;
      }
      
      const response = await axios(requestConfig);
      const duration = Date.now() - startTime;
      
      console.log(`✅ [${i+1}/15] ${test.name} - ${duration}ms - Status: ${response.status}`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        console.log(`🚨 HANG DETECTED! ${test.name} - TIMEOUT after ${duration}ms`);
        throw new Error(`HANG: ${test.name}`);
      }
      
      console.log(`❌ [${i+1}/15] ${test.name} - ${duration}ms - Error: ${error.response?.status || error.message}`);
    }
    
    // Delay 100ms antar request
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Bimbingan endpoints test completed');
}

// Jalankan test
if (import.meta.url === `file://${process.argv[1]}`) {
  testBimbinganEndpoints().catch(console.error);
}