// Test overlap untuk kasus spesifik

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function checkOverlap(existing, newSlot) {
  const existStart = toMinutes(existing.waktu_mulai);
  const existEnd = toMinutes(existing.waktu_selesai);
  const newStart = toMinutes(newSlot.waktu_mulai);
  const newEnd = toMinutes(newSlot.waktu_selesai);
  
  console.log('\n=== Checking Overlap ===');
  console.log('Existing:', `${existing.waktu_mulai}(${existStart}) - ${existing.waktu_selesai}(${existEnd})`);
  console.log('New:', `${newSlot.waktu_mulai}(${newStart}) - ${newSlot.waktu_selesai}(${newEnd})`);
  
  const condition1 = existEnd <= newStart;
  const condition2 = existStart >= newEnd;
  const overlap = !(condition1 || condition2);
  
  console.log('Condition 1 (existEnd <= newStart):', condition1, `(${existEnd} <= ${newStart})`);
  console.log('Condition 2 (existStart >= newEnd):', condition2, `(${existStart} >= ${newEnd})`);
  console.log('Overlap?', overlap);
  
  return overlap;
}

// Kasus mahasiswa 1: edit dari 09:30-11:31 ke 09:30-11:32
// Cek dengan mahasiswa 2 yang masih 09:30-11:30
console.log('\n🧪 Mahasiswa 1 edit ke 09:30-11:32, cek dengan Mahasiswa 2 (09:30-11:30)');
checkOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' }, // Mahasiswa 2
  { waktu_mulai: '09:30', waktu_selesai: '11:32' }  // Mahasiswa 1 baru
);

// Kasus mahasiswa 2: edit ke 09:30-11:32
// Cek dengan mahasiswa 1 yang sudah 09:30-11:32
console.log('\n🧪 Mahasiswa 2 edit ke 09:30-11:32, cek dengan Mahasiswa 1 (09:30-11:32)');
checkOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:32' }, // Mahasiswa 1 (sudah diupdate)
  { waktu_mulai: '09:30', waktu_selesai: '11:32' }  // Mahasiswa 2 baru
);
