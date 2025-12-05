# Migrasi dari x-user-id ke JWT Authentication

## Perubahan yang Dilakukan

### 1. Backend (API)

#### Auth Service (`apps/api/src/services/auth.service.ts`)
- ✅ Generate JWT token saat login
- ✅ Return `token` instead of `userId`
- Token berisi: `userId`, `email`, `role`
- **Expiry: TIDAK ADA (Permanent Login)** ✅

#### Auth Middleware (`apps/api/src/middlewares/auth.middleware.ts`)
- ✅ Verifikasi JWT dari header `Authorization: Bearer <token>`
- ✅ Hapus logika `x-user-id`
- Decode token dan extract user info

#### File Router (`apps/api/src/api/files.router.ts`)
- ✅ Endpoint baru untuk serve file dengan proteksi JWT:
  - `GET /api/files/dokumen-ta/:filename`
  - `GET /api/files/lampiran/:filename`

### 2. Frontend (Web)

#### API Client (`apps/web/lib/api.ts`)
- ✅ Kirim JWT di header `Authorization: Bearer <token>`
- ✅ Hapus `x-user-id` header

#### Hooks (`apps/web/hooks/useBimbingan.ts`)
- ✅ Update `useUploadLampiran` untuk gunakan Authorization header

#### Components
- ✅ Update `BimbinganCard.tsx` untuk akses file via `/api/files/dokumen-ta/`

### 3. Environment Variables

Tambahkan di `.env`:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Best Practice untuk File Access

### ❌ TIDAK DISARANKAN (Direct Access)
```
http://localhost:3002/uploads/dokumen-ta/file.pdf
```

**Masalah:**
- Tidak ada autentikasi
- Tidak ada authorization
- Tidak ada logging
- File bisa diakses siapa saja

### ✅ DISARANKAN (Protected Endpoint)
```
http://localhost:3002/api/files/dokumen-ta/file.pdf
```

**Keuntungan:**
- ✅ Terproteksi JWT authentication
- ✅ Bisa tambahkan authorization (cek apakah user berhak akses file)
- ✅ Logging akses file
- ✅ Rate limiting
- ✅ Validasi file existence

## Cara Menggunakan

### Login
```typescript
const response = await api.post('/auth/login', {
  identifier: 'email@example.com',
  password: 'password123'
});

// Response
{
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: { ... }
}

// Simpan token
localStorage.setItem('token', response.data.token);
```

### Akses Protected Endpoint
```typescript
// Otomatis ditambahkan oleh axios interceptor
const response = await api.get('/bimbingan/sebagai-dosen');

// Header yang dikirim:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Akses File
```typescript
const handleViewPdf = (filePath: string) => {
  const fileName = filePath.split('/').pop();
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/files/dokumen-ta/${fileName}`;
  window.open(url, '_blank');
};
```

## Migration Checklist

- [x] Install `jsonwebtoken` dan `@types/jsonwebtoken`
- [x] Update auth.service.ts untuk generate JWT
- [x] Update auth.middleware.ts untuk verify JWT
- [x] Update frontend API client untuk kirim JWT
- [x] Buat protected file endpoint
- [x] Update semua komponen yang akses file
- [x] Hapus semua referensi `x-user-id`
- [x] Tambahkan JWT_SECRET ke .env
- [x] Tambahkan auto-migration handler untuk old token
- [ ] **PENTING: User harus LOGIN ULANG sekali untuk mendapat JWT token baru**
- [ ] Test login flow
- [ ] Test file access
- [ ] Test semua protected endpoints

## ⚠️ PENTING: Migrasi untuk User yang Sudah Login

**User yang sudah login dengan sistem lama (x-user-id) HARUS LOGIN ULANG SEKALI.**

Sistem akan otomatis:
1. Deteksi token lama (format numeric)
2. Hapus token lama dari localStorage
3. Redirect ke halaman login
4. User login sekali → Dapat JWT token baru
5. Setelah itu, user login SELAMANYA (tidak perlu login lagi)

## Testing

### 1. Test Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"email@example.com","password":"password"}'
```

### 2. Test Protected Endpoint
```bash
curl http://localhost:3002/api/bimbingan/sebagai-dosen \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test File Access
```bash
curl http://localhost:3002/api/files/dokumen-ta/filename.pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Notes

1. **JWT Secret**: Gunakan string random yang kuat untuk production
2. **Token Expiry**: Token tidak pernah expired - user login selamanya sampai logout
3. **HTTPS**: Gunakan HTTPS di production untuk encrypt token
4. **Refresh Token**: Pertimbangkan implementasi refresh token untuk UX lebih baik
5. **File Access**: Tambahkan authorization check (apakah user berhak akses file tertentu)

## Troubleshooting

### Error: "Unauthorized: No token provided"
- Pastikan token tersimpan di localStorage
- Cek axios interceptor mengirim header Authorization

### Error: "jwt malformed"
- Token lama (format userId) masih ada di localStorage
- Sistem akan otomatis redirect ke login
- Login sekali untuk dapat JWT token baru

### Error: "jwt expired"
- Tidak akan terjadi karena token tidak ada expiry

### File tidak bisa diakses
- Pastikan menggunakan endpoint `/api/files/` bukan `/uploads/`
- Pastikan token valid
- Cek file exists di server
