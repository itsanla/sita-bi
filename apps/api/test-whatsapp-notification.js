/**
 * Script untuk testing notifikasi WhatsApp pengajuan pembimbing
 * 
 * Cara menjalankan:
 * node test-whatsapp-notification.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

// Ganti dengan token yang valid
const AUTH_TOKEN = 'your_jwt_token_here';

// Test data
const TEST_DATA = {
  mahasiswaId: 1,
  dosenId: 1,
  peran: 'pembimbing1' // atau 'pembimbing2'
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    
    return { response, data };
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.message);
    return null;
  }
}

async function testWhatsAppStatus() {
  console.log('🔍 Checking WhatsApp Status...');
  await makeRequest('/whatsapp/status');
}

async function testPengajuanMahasiswa() {
  console.log('📱 Testing Pengajuan Mahasiswa ke Dosen...');
  const result = await makeRequest('/pengajuan/mahasiswa', 'POST', {
    dosenId: TEST_DATA.dosenId,
    peran: TEST_DATA.peran
  });
  
  if (result && result.data.status === 'sukses') {
    console.log('✅ Pengajuan berhasil dibuat, notifikasi WhatsApp seharusnya terkirim ke dosen');
    return result.data.data.id; // Return pengajuan ID untuk testing selanjutnya
  }
  
  return null;
}

async function testTawaranDosen() {
  console.log('👨‍🏫 Testing Tawaran Dosen ke Mahasiswa...');
  const result = await makeRequest('/pengajuan/dosen', 'POST', {
    mahasiswaId: TEST_DATA.mahasiswaId,
    peran: TEST_DATA.peran
  });
  
  if (result && result.data.status === 'sukses') {
    console.log('✅ Tawaran berhasil dibuat, notifikasi WhatsApp seharusnya terkirim ke mahasiswa');
    return result.data.data.id; // Return pengajuan ID untuk testing selanjutnya
  }
  
  return null;
}

async function testTerimaPengajuan(pengajuanId) {
  if (!pengajuanId) {
    console.log('❌ Tidak ada pengajuan ID untuk test penerimaan');
    return;
  }
  
  console.log(`✅ Testing Terima Pengajuan ID: ${pengajuanId}...`);
  const result = await makeRequest(`/pengajuan/${pengajuanId}/terima`, 'POST');
  
  if (result && result.data.status === 'sukses') {
    console.log('✅ Pengajuan berhasil diterima, notifikasi WhatsApp seharusnya terkirim');
  }
}

async function testTolakPengajuan(pengajuanId) {
  if (!pengajuanId) {
    console.log('❌ Tidak ada pengajuan ID untuk test penolakan');
    return;
  }
  
  console.log(`❌ Testing Tolak Pengajuan ID: ${pengajuanId}...`);
  const result = await makeRequest(`/pengajuan/${pengajuanId}/tolak`, 'POST');
  
  if (result && result.data.status === 'sukses') {
    console.log('✅ Pengajuan berhasil ditolak, notifikasi WhatsApp seharusnya terkirim');
  }
}

async function testBatalkanPengajuan(pengajuanId) {
  if (!pengajuanId) {
    console.log('❌ Tidak ada pengajuan ID untuk test pembatalan');
    return;
  }
  
  console.log(`🚫 Testing Batalkan Pengajuan ID: ${pengajuanId}...`);
  const result = await makeRequest(`/pengajuan/${pengajuanId}/batalkan`, 'POST');
  
  if (result && result.data.status === 'sukses') {
    console.log('✅ Pengajuan berhasil dibatalkan, notifikasi WhatsApp seharusnya terkirim');
  }
}

async function testGetPengajuanMahasiswa() {
  console.log('📋 Getting Pengajuan Mahasiswa...');
  await makeRequest('/pengajuan/mahasiswa');
}

async function testGetPengajuanDosen() {
  console.log('📋 Getting Pengajuan Dosen...');
  await makeRequest('/pengajuan/dosen');
}

async function runAllTests() {
  console.log('🚀 Starting WhatsApp Notification Tests...\n');
  
  // 1. Check WhatsApp status
  await testWhatsAppStatus();
  
  // 2. Test pengajuan mahasiswa (akan mengirim notifikasi ke dosen)
  const pengajuanId = await testPengajuanMahasiswa();
  
  // 3. Test tawaran dosen (akan mengirim notifikasi ke mahasiswa)
  const tawaranId = await testTawaranDosen();
  
  // 4. Test terima pengajuan (pilih salah satu)
  if (pengajuanId) {
    await testTerimaPengajuan(pengajuanId);
  }
  
  // 5. Test tolak tawaran (jika ada)
  if (tawaranId) {
    await testTolakPengajuan(tawaranId);
  }
  
  // 6. Get current pengajuan
  await testGetPengajuanMahasiswa();
  await testGetPengajuanDosen();
  
  console.log('✅ All tests completed!');
  console.log('\n📱 Check your WhatsApp to see if notifications were received.');
}

// Jalankan tests
if (require.main === module) {
  if (AUTH_TOKEN === 'your_jwt_token_here') {
    console.error('❌ Please set a valid AUTH_TOKEN in the script');
    process.exit(1);
  }
  
  runAllTests().catch(console.error);
}

module.exports = {
  testWhatsAppStatus,
  testPengajuanMahasiswa,
  testTawaranDosen,
  testTerimaPengajuan,
  testTolakPengajuan,
  testBatalkanPengajuan
};