// Daftar endpoint yang di-skip dari testing
export const skippedEndpoints = [
  {
    module: 'Auth',
    endpoints: [
      {
        path: 'POST /register',
        reason: 'Butuh data mahasiswa valid (NIM, email unik, prodi, kelas)'
      },
      {
        path: 'POST /verify-email',
        reason: 'Butuh token verifikasi dari email service'
      },
      {
        path: 'POST /forgot-password',
        reason: 'Butuh email service aktif untuk kirim link reset'
      },
      {
        path: 'POST /reset-password',
        reason: 'Butuh token reset password dari email'
      }
    ]
  },
  {
    module: 'Bimbingan',
    endpoints: [
      // Semua endpoint bimbingan sudah ditest
    ]
  },
  {
    module: 'Aturan Validasi',
    endpoints: [
      // Semua endpoint aturan validasi sudah ditest
    ]
  }
];

export function getSkippedCount(): number {
  return skippedEndpoints.reduce((total, module) => total + module.endpoints.length, 0);
}

export function displaySkippedEndpoints(): void {
  console.log('📋 SKIPPED ENDPOINTS DETAIL\n');
  console.log('='.repeat(60));
  
  let totalSkipped = 0;
  
  for (const module of skippedEndpoints) {
    if (module.endpoints.length === 0) continue;
    
    console.log(`\n📚 ${module.module} (${module.endpoints.length} skipped)`);
    console.log('-'.repeat(60));
    
    for (const endpoint of module.endpoints) {
      console.log(`\n  ⏭️  ${endpoint.path}`);
      console.log(`     Reason: ${endpoint.reason}`);
      totalSkipped++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Total Skipped: ${totalSkipped} endpoints`);
  console.log('='.repeat(60));
  console.log('\nNote: Skipped endpoints adalah flow sekunder yang:');
  console.log('  - Jarang digunakan dalam operasi normal');
  console.log('  - Butuh setup kompleks (email service, data valid)');
  console.log('  - Tidak berpotensi hang (operasi sederhana)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  displaySkippedEndpoints();
}
