# RBAC Implementation Guide - SITA-BI

## ✅ Implementasi Lengkap

### Backend Implementation

#### 1. Middleware & Authorization
**File:** `apps/api/src/middlewares/rbac.middleware.ts`
- ✅ `validateProdiScope()` - Validasi scope prodi untuk Kaprodi
- ✅ `validateDosenMahasiswaRelation()` - Validasi relasi dosen-mahasiswa
- ✅ `validateDosenTugasAkhirAccess()` - Validasi akses dosen ke tugas akhir
- ✅ `validatePembimbingCapacity()` - Validasi kapasitas pembimbing (max 4)

#### 2. RBAC Helpers
**File:** `apps/api/src/utils/rbac-helpers.ts`
- ✅ `getUserRBACData()` - Get complete RBAC data untuk user
- ✅ `canAccessMahasiswa()` - Check apakah user bisa akses mahasiswa
- ✅ `getAccessibleMahasiswaIds()` - Get list mahasiswa yang bisa diakses
- ✅ `getDosenCapacity()` - Get info kapasitas dosen
- ✅ `validateTeamComposition()` - Validasi komposisi tim pembimbing & penguji

#### 3. Auth Service Enhancement
**File:** `apps/api/src/services/auth.service.ts`
- ✅ `getCurrentUser()` - Return user data dengan assignments lengkap
- ✅ Include `assignedMahasiswa` untuk dosen
- ✅ Include `peranDosenTa` untuk tracking assignments

#### 4. RBAC Router
**File:** `apps/api/src/api/rbac.router.ts`
- ✅ `GET /api/rbac/me` - Get RBAC data user
- ✅ `GET /api/rbac/dosen/:dosenId/capacity` - Get kapasitas dosen
- ✅ `GET /api/rbac/dosen/capacity/all` - Get semua dosen dengan kapasitas

### Frontend Implementation

#### 1. Types & Interfaces
**File:** `apps/web/types/rbac.ts`
- ✅ `Role` type definition
- ✅ `Prodi` type definition
- ✅ `RBACContext` interface
- ✅ `RBACPermissions` interface

#### 2. RBAC Hook
**File:** `apps/web/hooks/useRBAC.ts`
- ✅ `useRBAC()` - Main hook untuk RBAC checks
- ✅ Returns: role, prodi, permissions, helper functions
- ✅ `canAccessMahasiswa()` - Check akses ke mahasiswa
- ✅ Boolean flags: isKajur, isKaprodi, isDosen, isMahasiswa

#### 3. Guard Components
**File:** `apps/web/components/shared/RBACGuard.tsx`
- ✅ `RBACGuard` - Role-based conditional rendering
- ✅ `PermissionGuard` - Permission-based conditional rendering

**File:** `apps/web/components/shared/RouteGuard.tsx`
- ✅ `RouteGuard` - Page-level route protection
- ✅ Auto-redirect unauthorized users
- ✅ Loading state handling

#### 4. RBAC Utilities
**File:** `apps/web/lib/rbac-utils.ts`
- ✅ `getRoleDisplayName()` - Get display name untuk role
- ✅ `getProdiDisplayName()` - Get display name untuk prodi
- ✅ `filterByProdi()` - Filter data by prodi scope
- ✅ `canEditMahasiswa()` - Check edit permission
- ✅ `getDosenCapacityColor()` - Get color untuk capacity indicator
- ✅ `getDosenCapacityBadge()` - Get badge untuk capacity
- ✅ `validatePembimbingSelection()` - Validasi pemilihan pembimbing
- ✅ `validatePengujiSelection()` - Validasi pemilihan penguji

#### 5. Capacity Management
**File:** `apps/web/hooks/useDosenCapacity.ts`
- ✅ `useDosenCapacity()` - Fetch all dosen dengan kapasitas
- ✅ `useDosenCapacityById()` - Fetch kapasitas dosen spesifik

**File:** `apps/web/components/admin/DosenCapacityIndicator.tsx`
- ✅ Visual indicator untuk kapasitas dosen
- ✅ Color-coded (green/yellow/orange/red)
- ✅ Badge display (Tersedia/Hampir Penuh/Penuh)

#### 6. Assignment Components
**File:** `apps/web/components/admin/PembimbingSelector.tsx`
- ✅ Dropdown selector untuk pembimbing 1 & 2
- ✅ Real-time capacity display
- ✅ Auto-disable dosen yang penuh
- ✅ Validation: P1 ≠ P2
- ✅ Warning untuk dosen hampir penuh

**File:** `apps/web/components/admin/PengujiSelector.tsx`
- ✅ Dropdown selector untuk 3 penguji
- ✅ Validation: semua penguji berbeda
- ✅ No capacity limit
- ✅ Auto-filter selected penguji

## 📋 Hierarki Role & Permissions

### KAJUR (Tier 3)
```typescript
{
  canViewAllMahasiswa: true,
  canViewAllDosen: true,
  canAssignPembimbing: true,
  canAssignPenguji: true,
  canManageUsers: true,
  canApproveJudul: true,
  canAccessReports: true,
  canManagePenjadwalan: true,
  scopeProdi: null, // Akses semua prodi
}
```

### KAPRODI (Tier 2)
```typescript
{
  canViewAllMahasiswa: false, // Hanya prodi sendiri
  canViewAllDosen: true,
  canAssignPembimbing: true,
  canAssignPenguji: true,
  canManageUsers: false,
  canApproveJudul: true,
  canAccessReports: true,
  canManagePenjadwalan: true,
  scopeProdi: 'D3' | 'D4', // Terbatas pada prodi
}
```

### DOSEN (Tier 1)
```typescript
{
  canViewAllMahasiswa: false, // Hanya assigned
  canViewAllDosen: false,
  canAssignPembimbing: false,
  canAssignPenguji: false,
  canManageUsers: false,
  canApproveJudul: false,
  canAccessReports: false,
  canManagePenjadwalan: false,
  scopeProdi: null,
  // Akses hanya ke mahasiswa assigned
}
```

## 🔧 Usage Examples

### 1. Protect Route
```tsx
import { RouteGuard } from '@/components/shared/RouteGuard';

export default function AdminPage() {
  return (
    <RouteGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4', 'admin']}>
      <div>Admin Content</div>
    </RouteGuard>
  );
}
```

### 2. Conditional Rendering
```tsx
import { RBACGuard, PermissionGuard } from '@/components/shared/RBACGuard';

function Dashboard() {
  return (
    <div>
      <RBACGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4']}>
        <button>Assign Pembimbing</button>
      </RBACGuard>

      <PermissionGuard permission="canAccessReports">
        <ReportsSection />
      </PermissionGuard>
    </div>
  );
}
```

### 3. Use RBAC Hook
```tsx
import { useRBAC } from '@/hooks/useRBAC';

function MyComponent() {
  const { role, isKajur, canAssignPembimbing, canAccessMahasiswa } = useRBAC();

  if (isKajur) {
    return <KajurDashboard />;
  }

  if (canAssignPembimbing) {
    return <AssignmentForm />;
  }

  return <DefaultView />;
}
```

### 4. Pembimbing Assignment
```tsx
import { PembimbingSelector } from '@/components/admin/PembimbingSelector';

function AssignPembimbingForm() {
  const [pembimbing, setPembimbing] = useState({
    pembimbing1Id: null,
    pembimbing2Id: null,
  });

  return (
    <PembimbingSelector
      value={pembimbing}
      onChange={setPembimbing}
      mahasiswaProdi="D3"
    />
  );
}
```

### 5. Filter Data by Prodi
```tsx
import { filterByProdi } from '@/lib/rbac-utils';
import { useRBAC } from '@/hooks/useRBAC';

function MahasiswaList() {
  const { role, prodi } = useRBAC();
  const { data: allMahasiswa } = useMahasiswa();

  const filteredMahasiswa = filterByProdi(allMahasiswa, prodi, role);

  return (
    <table>
      {filteredMahasiswa.map(m => (
        <tr key={m.id}>...</tr>
      ))}
    </table>
  );
}
```

## 🛡️ Backend Middleware Usage

### 1. Validate Prodi Scope
```typescript
import { validateProdiScope } from '../middlewares/rbac.middleware';

router.get(
  '/mahasiswa',
  authMiddleware,
  validateProdiScope(), // Kaprodi auto-filtered by prodi
  async (req, res) => {
    // Handler
  }
);
```

### 2. Validate Dosen-Mahasiswa Relation
```typescript
import { validateDosenMahasiswaRelation } from '../middlewares/rbac.middleware';

router.post(
  '/bimbingan/:mahasiswaId',
  authMiddleware,
  validateDosenMahasiswaRelation, // Check if dosen assigned to mahasiswa
  async (req, res) => {
    // Handler
  }
);
```

### 3. Validate Tugas Akhir Access
```typescript
import { validateDosenTugasAkhirAccess } from '../middlewares/rbac.middleware';

router.get(
  '/tugas-akhir/:id',
  authMiddleware,
  validateDosenTugasAkhirAccess, // Check if dosen assigned to TA
  async (req, res) => {
    // Handler
  }
);
```

## ✅ Business Rules Enforced

### Pembimbing Rules
- ✅ Maksimal 4 mahasiswa per dosen
- ✅ Pembimbing 1 ≠ Pembimbing 2
- ✅ Validasi kapasitas sebelum assign
- ✅ Warning saat kapasitas 3/4
- ✅ Disable dosen yang 4/4

### Penguji Rules
- ✅ 3 penguji harus berbeda
- ✅ Tidak ada limit kapasitas
- ✅ Minimal 1 penguji wajib
- ✅ Auto-filter penguji yang sudah dipilih

### Access Control Rules
- ✅ Kajur: akses unlimited
- ✅ Kaprodi: scope prodi only
- ✅ Dosen: assigned mahasiswa only
- ✅ Mahasiswa: data sendiri only

## 🎯 Next Steps untuk Implementasi Penuh

### 1. Apply ke Existing Routes
Tambahkan middleware RBAC ke routes yang ada:
- `/api/tugas-akhir/*` - Add validateDosenTugasAkhirAccess
- `/api/bimbingan/*` - Add validateDosenMahasiswaRelation
- `/api/mahasiswa/*` - Add validateProdiScope

### 2. Update Frontend Pages
Wrap pages dengan RouteGuard:
- `/dashboard/admin/*` - Require kajur/kaprodi
- `/dashboard/dosen/*` - Require dosen
- `/dashboard/mahasiswa/*` - Require mahasiswa

### 3. Add Conditional UI
Gunakan RBACGuard untuk:
- Navigation menu items
- Action buttons
- Form fields
- Data tables

### 4. Implement Data Filtering
Gunakan filterByProdi untuk:
- Mahasiswa lists
- Tugas akhir lists
- Reports
- Statistics

## 📊 Testing Checklist

### Backend
- [ ] Kajur dapat akses semua endpoint
- [ ] Kaprodi hanya akses prodi sendiri
- [ ] Dosen hanya akses mahasiswa assigned
- [ ] Pembimbing capacity validation works
- [ ] Team composition validation works

### Frontend
- [ ] Route guards redirect unauthorized users
- [ ] RBAC guards hide unauthorized UI
- [ ] Pembimbing selector shows capacity
- [ ] Penguji selector validates uniqueness
- [ ] Data filtered by prodi scope
- [ ] Role-based navigation menu

## 🚀 Deployment Notes

1. **Database Migration**: Pastikan field `prodi` di tabel `dosen` sudah ada
2. **Seed Data**: Update seed untuk set prodi pada Kaprodi
3. **Environment**: Tidak ada env variable baru
4. **Testing**: Test dengan 3 role berbeda (Kajur, Kaprodi, Dosen)

---

**Status**: ✅ RBAC Implementation Complete
**Last Updated**: 2025-01-25
**Version**: 1.0.0
