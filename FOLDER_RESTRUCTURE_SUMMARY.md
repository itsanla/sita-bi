# Folder Restructure Summary

## 📦 Perubahan Struktur Folder

### Tanggal: 29 November 2024

## 🎯 Tujuan
Memindahkan folder `documentation/` dan `uploads/` dari root monorepo ke dalam `apps/api/` untuk:
- ✅ Self-contained backend
- ✅ Deployment lebih mudah
- ✅ Docker build lebih simple
- ✅ Ownership yang jelas (backend yang pakai, backend yang simpan)

## 📁 Perubahan Struktur

### **Sebelum:**
```
sita-bi/
├── documentation/
│   └── model/
│       ├── documentation.json
│       └── information.json
├── uploads/
│   └── .gitkeep
└── apps/
    └── api/
        ├── src/
        └── uploads/  (duplikat)
```

### **Sesudah:**
```
sita-bi/
└── apps/
    └── api/
        ├── documentation/
        │   └── model/
        │       ├── documentation.json
        │       └── information.json
        ├── uploads/
        │   ├── .gitkeep
        │   └── bimbingan/
        └── src/
```

## 🔧 File yang Dimodifikasi

### 1. **apps/api/src/services/gemini.service.ts**
**Perubahan:** Update path documentation dari root ke apps/api

```typescript
// Sebelum:
private readonly documentationPath = path.join(
  process.cwd(),
  '..',
  '..',
  'documentation',
  'model',
  'documentation.json',
);

// Sesudah:
private readonly documentationPath = path.join(
  process.cwd(),
  'documentation',
  'model',
  'documentation.json',
);
```

**Impact:** ✅ AI Chatbot Gemini tetap bisa membaca documentation.json dan information.json

### 2. **apps/api/src/utils/upload.config.ts**
**Perubahan:** Ganti `getMonorepoRoot()` menjadi `getApiRoot()`

```typescript
// Sebelum:
export const getMonorepoRoot = (): string => {
  const currentDir = process.cwd();
  if (currentDir.includes(path.join('apps', 'api'))) {
    return path.resolve(currentDir, '../..');
  }
  return currentDir;
};

// Sesudah:
export const getApiRoot = (): string => {
  return process.cwd(); // apps/api
};
```

**Impact:** ✅ Upload file tetap berfungsi, path sekarang relatif ke apps/api

### 3. **apps/api/src/api/files.router.ts**
**Perubahan:** Update import dan penggunaan `getMonorepoRoot` → `getApiRoot`

```typescript
// Sebelum:
import { getMonorepoRoot, ... } from '../utils/upload.config';
const monorepoRoot = getMonorepoRoot();

// Sesudah:
import { getApiRoot, ... } from '../utils/upload.config';
const apiRoot = getApiRoot();
```

**Impact:** ✅ File download/upload tetap berfungsi

### 4. **apps/api/src/app.ts**
**Perubahan:** Update import dan komentar

```typescript
// Sebelum:
import { getUploadPath, getMonorepoRoot } from './utils/upload.config';
// Pastikan directory uploads exists di monorepo root
monorepoRoot: getMonorepoRoot(),

// Sesudah:
import { getUploadPath, getApiRoot } from './utils/upload.config';
// Pastikan directory uploads exists di apps/api
apiRoot: getApiRoot(),
```

**Impact:** ✅ Static file serving tetap berfungsi

### 5. **.gitignore**
**Perubahan:** Tambah ignore untuk uploads di apps/api

```gitignore
# Uploads (keep structure but ignore files)
apps/api/uploads/*
!apps/api/uploads/.gitkeep
!apps/api/uploads/bimbingan/
apps/api/uploads/bimbingan/*
!apps/api/uploads/bimbingan/.gitkeep
```

**Impact:** ✅ Struktur folder tetap di-track, tapi file upload tidak

## ✅ Verifikasi

### Test Checklist:
- [x] Folder `documentation/` berhasil dipindah ke `apps/api/documentation/`
- [x] Folder `uploads/` di root dihapus (sudah ada di `apps/api/uploads/`)
- [x] File `gemini.service.ts` bisa membaca documentation.json
- [x] File upload/download tetap berfungsi
- [x] Path relatif sudah benar
- [x] .gitignore sudah update
- [x] Tidak ada referensi ke `getMonorepoRoot` lagi

### Command untuk Test:

```bash
# 1. Cek struktur folder
ls -la apps/api/documentation/model/
ls -la apps/api/uploads/

# 2. Test build
cd apps/api
pnpm build

# 3. Test run
pnpm dev

# 4. Test endpoints
curl http://localhost:3002/health
curl http://localhost:3002/api/gemini/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'
```

## 🚀 Benefit untuk Production

### **Docker Build:**
```dockerfile
# Sebelum (rumit):
COPY apps/api ./api
COPY documentation ./documentation  # Path relatif rumit
COPY uploads ./uploads              # Path relatif rumit

# Sesudah (simple):
COPY apps/api ./
# Semua sudah include!
```

### **Deployment:**
- ✅ Self-contained: 1 folder `apps/api/` sudah lengkap
- ✅ Portable: Bisa dipindah tanpa dependency ke root
- ✅ Clear ownership: Backend owns its data
- ✅ Docker layer caching lebih efektif

## 📝 Notes

1. **Logika bisnis tidak berubah** - Semua fungsi tetap sama
2. **API endpoints tidak berubah** - Frontend tidak perlu update
3. **Database tidak terpengaruh** - Path di DB tetap relatif
4. **WhatsApp session** - Tetap di `apps/api/.wwebjs_auth/`

## 🔄 Rollback (Jika Diperlukan)

Jika ada masalah, rollback dengan:

```bash
# 1. Pindahkan kembali ke root
mv apps/api/documentation ./
mkdir uploads
touch uploads/.gitkeep

# 2. Revert file changes
git checkout apps/api/src/services/gemini.service.ts
git checkout apps/api/src/utils/upload.config.ts
git checkout apps/api/src/api/files.router.ts
git checkout apps/api/src/app.ts
git checkout .gitignore
```

## ✅ Status: COMPLETED

Semua perubahan telah selesai dan diverifikasi. Backend sekarang self-contained dan siap untuk production deployment.
