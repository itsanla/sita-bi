// Test overlap detection logic

function testOverlap(existing, newSlot) {
  console.log('\n=== Testing Overlap ===');
  console.log('Existing:', existing);
  console.log('New Slot:', newSlot);
  
  // Logika NOT yang digunakan di Prisma
  // Overlap jika TIDAK (selesai <= mulai ATAU mulai >= selesai)
  const notCondition1 = existing.waktu_selesai <= newSlot.waktu_mulai;
  const notCondition2 = existing.waktu_mulai >= newSlot.waktu_selesai;
  
  console.log('Condition 1 (selesai <= mulai):', notCondition1);
  console.log('Condition 2 (mulai >= selesai):', notCondition2);
  console.log('NOT (C1 OR C2) = Overlap?', !(notCondition1 || notCondition2));
  
  return !(notCondition1 || notCondition2);
}

// Test cases
console.log('\n🧪 Test Case 1: Overlap penuh (09:30-11:30 vs 09:30-11:30)');
testOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' },
  { waktu_mulai: '09:30', waktu_selesai: '11:30' }
);

console.log('\n🧪 Test Case 2: Overlap 1 menit (09:30-11:30 vs 09:30-11:31)');
testOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' },
  { waktu_mulai: '09:30', waktu_selesai: '11:31' }
);

console.log('\n🧪 Test Case 3: Overlap 1 menit di akhir (09:30-11:30 vs 11:29-12:00)');
testOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' },
  { waktu_mulai: '11:29', waktu_selesai: '12:00' }
);

console.log('\n🧪 Test Case 4: Tidak overlap (09:30-11:30 vs 11:30-13:00)');
testOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' },
  { waktu_mulai: '11:30', waktu_selesai: '13:00' }
);

console.log('\n🧪 Test Case 5: Tidak overlap (09:30-11:30 vs 08:00-09:30)');
testOverlap(
  { waktu_mulai: '09:30', waktu_selesai: '11:30' },
  { waktu_mulai: '08:00', waktu_selesai: '09:30' }
);
