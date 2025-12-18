import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TOKEN = process.env.JWT_TOKEN_DOSEN;

async function infinityTriggerHang() {
  console.log('🔥 INFINITY HANG TRIGGER - Will run until backend hangs...\n');
  
  let cycle = 0;
  let totalSent = 0;
  let connectionLost = false;
  const startTime = Date.now();
  
  while (!connectionLost) {
    cycle++;
    console.log(`\n🔄 CYCLE ${cycle} - Sending 1000 concurrent requests...`);
    
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      const promise = axios.get(`${BASE_URL}/api/bimbingan/sebagai-dosen?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        timeout: 15000,
      }).catch((err) => {
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          connectionLost = true;
        }
      });
      promises.push(promise);
      totalSent++;
    }
    
    await Promise.allSettled(promises);
    
    if (connectionLost) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`\n🎉 SUCCESS! Backend hung and restarted after ${duration}s`);
      console.log(`📊 Total requests sent: ${totalSent}`);
      console.log(`🔄 Cycles completed: ${cycle}`);
      console.log('✅ Auto-restart protection is working!');
      break;
    }
    
    console.log(`   ✅ Cycle ${cycle} completed - Backend still alive`);
    console.log(`   📤 Total sent so far: ${totalSent}`);
    
    // Small delay between cycles
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

infinityTriggerHang().catch(console.error);
