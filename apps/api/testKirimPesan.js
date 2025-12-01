/**
 * Script Simple untuk Testing WhatsApp
 * Bisa dijalankan dengan: node testKirimPesan.js
 * 
 * PASTIKAN: Backend sudah running!
 */

// Load environment variables
require('dotenv').config();

async function kirimPesan() {
  // Gunakan API_URL dari environment variable
  const API_URL = process.env.API_URL;
  const baseUrl = `${API_URL}/api/whatsapp`;
  
  console.log(`📱 Testing WhatsApp Integration on ${API_URL}...\n`);

  try {
    // 1. Cek Status
    console.log('1️⃣ Checking WhatsApp status...');
    const statusRes = await fetch(`${baseUrl}/status`, {
      headers: { 'x-user-id': '1' }
    });
    const status = await statusRes.json();
    console.log('   Status:', status.data.isReady ? '✅ Ready' : '❌ Not Ready');
    
    if (!status.data.isReady) {
      console.error('   ❌ WhatsApp belum ready! Scan QR code dulu.');
      return;
    }

    // 2. Kirim Pesan
    console.log('\n2️⃣ Sending message to 082284184525...');
    const sendRes = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1'
      },
      body: JSON.stringify({
        to: '082284184525',
        message: '🎉 *Test WhatsApp SITA-BI*\n\n' +
                 'Halo! Ini pesan test dari sistem.\n\n' +
                 '✅ Integrasi berhasil!\n' +
                 '📱 Notifikasi WhatsApp aktif.\n\n' +
                 `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                 `🌐 Server: ${API_URL}\n\n` +
                 '_Pesan otomatis dari SITA-BI Backend_'
      })
    });
    
    const sendResult = await sendRes.json();
    
    if (sendResult.success) {
      console.log('   ✅ Pesan berhasil dikirim!');
    } else {
      console.log('   ❌ Gagal kirim:', sendResult.message);
    }

    // 3. Cek Registrasi Nomor
    console.log('\n3️⃣ Checking number registration...');
    const checkRes = await fetch(`${baseUrl}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1'
      },
      body: JSON.stringify({
        phone: '082284184525'
      })
    });
    
    const checkResult = await checkRes.json();
    console.log('   Registration:', checkResult.data.isRegistered ? '✅ Terdaftar' : '❌ Tidak terdaftar');

    console.log('\n✨ Test selesai!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log(`\n💡 Pastikan backend running di ${API_URL}\n`);
  }
}

// Jalankan
kirimPesan();
