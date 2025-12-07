# Clear Cache & Token

Jika Anda mengalami error "User tidak ditemukan" setelah reset database, ikuti langkah berikut:

## Cara 1: Otomatis (Sudah Diterapkan)
Sistem akan otomatis menghapus token dan redirect ke login jika user tidak ditemukan.

## Cara 2: Manual via Browser Console

1. Buka browser (Chrome/Firefox/Edge)
2. Tekan `F12` atau `Ctrl+Shift+I` untuk membuka Developer Tools
3. Buka tab **Console**
4. Ketik dan jalankan:
```javascript
localStorage.clear();
location.reload();
```

## Cara 3: Manual via Browser Settings

### Chrome:
1. Klik ikon 3 titik (⋮) di pojok kanan atas
2. Pilih **More tools** → **Clear browsing data**
3. Pilih **Cookies and other site data**
4. Klik **Clear data**

### Firefox:
1. Klik ikon 3 garis (≡) di pojok kanan atas
2. Pilih **Settings** → **Privacy & Security**
3. Scroll ke **Cookies and Site Data**
4. Klik **Clear Data**

## Cara 4: Incognito/Private Mode
Buka browser dalam mode incognito/private untuk testing tanpa cache.

## Setelah Database Reset
Setelah menjalankan seeder, pastikan:
1. Clear localStorage (gunakan salah satu cara di atas)
2. Refresh halaman atau buka tab baru
3. Login dengan credentials baru dari seeder

## Login Credentials (password: password123)
- Admin: `admin@pnp.ac.id`
- Jurusan: `jurusan@pnp.ac.id`
- Dosen: `rina.anggraini@pnp.ac.id`
- Mahasiswa: `2101010001@student.pnp.ac.id`
