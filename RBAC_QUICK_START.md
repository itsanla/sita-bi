# RBAC Quick Start Guide

## ✅ IMPLEMENTASI SELESAI

RBAC lengkap telah diimplementasikan dari backend sampai frontend. Sistem sudah siap digunakan.

## 🚀 Cara Menggunakan

### Backend - Protect Route

```typescript
// Import middleware
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validateDosenTugasAkhirAccess } from '../middlewares/rbac.middleware';
import { Role } from '@repo/types';

// Protect dengan role
router.get(
  '/endpoint',
  authMiddleware,
  authorizeRoles([Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4]),
  asyncHandler(async (req, res) => {
    // Handler
  })
);

// Protect dengan relationship validation
router.get(
  '/tugas-akhir/:id',
  authMiddleware,
  authorizeRoles([Role.dosen]),
  validateDosenTugasAkhirAccess, // Dosen hanya bisa akses TA yang assigned
  asyncHandler(async (req, res) => {
    // Handler
  })
);
```

### Frontend - Protect Page

```tsx
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'kajur']}>
      <div>Admin Content</div>
    </ProtectedRoute>
  );
}
```

### Frontend - Conditional Rendering

```tsx
import RBACGuard from '@/components/shared/RBACGuard';

export default function Dashboard() {
  return (
    <div>
      <RBACGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4']}>
        <button>Assign Pembimbing</button>
      </RBACGuard>
    </div>
  );
}
```

### Frontend - Use Hook

```tsx
import { useRBAC } from '@/hooks/useRBAC';

export default function MyComponent() {
  const { isKajur, isKaprodi, isDosen, canAccessAllData } = useRBAC();

  if (isKajur) return <KajurDashboard />;
  if (isKaprodi) return <KaprodiDashboard />;
  if (isDosen) return <DosenDashboard />;
  
  return <DefaultDashboard />;
}
```

### Frontend - Capacity Check

```tsx
import { useDosenCapacity } from '@/hooks/useDosenCapacity';
import DosenCapacityBadge from '@/components/shared/DosenCapacityBadge';

export default function DosenList() {
  const { capacities, isAvailable } = useDosenCapacity();

  return (
    <div>
      {capacities.map((c) => (
        <div key={c.dosenId}>
          <span>{c.name}</span>
          <DosenCapacityBadge current={c.capacity.current} max={4} />
          {!isAvailable(c.dosenId) && <span>PENUH</span>}
        </div>
      ))}
    </div>
  );
}
```

## 📁 File-file Penting

### Backend
- `apps/api/src/middlewares/rbac.middleware.ts` - RBAC middleware
- `apps/api/src/utils/rbac-helpers.ts` - Helper functions
- `apps/api/src/api/rbac.router.ts` - RBAC endpoints
- `apps/api/src/services/auth.service.ts` - Enhanced dengan assigned mahasiswa

### Frontend
- `apps/web/hooks/useRBAC.ts` - Main RBAC hook
- `apps/web/hooks/useDosenCapacity.ts` - Capacity hook
- `apps/web/components/shared/ProtectedRoute.tsx` - Route protection
- `apps/web/components/shared/RBACGuard.tsx` - Component guard
- `apps/web/components/shared/DosenCapacityBadge.tsx` - Capacity badge
- `apps/web/lib/rbac-utils.ts` - Utility functions
- `apps/web/types/index.ts` - RBAC types

### Examples
- `apps/web/app/dashboard/components/RoleBasedDashboard.tsx` - Dashboard example
- `apps/web/components/forms/AssignPembimbingForm.tsx` - Form example
- `apps/api/src/api/bimbingan.router.ts` - Router example (updated)

## 🎯 Hierarki Role

```
KAJUR (Tier 3)
├── Akses: SEMUA data (D3 + D4)
├── Inherit: Semua permission Kaprodi & Dosen
└── Can: Manage users, assign dosen, validate judul, view all reports

KAPRODI (Tier 2)
├── Akses: Data PRODI mereka saja (D3 atau D4)
├── Inherit: Semua permission Dosen (dalam scope)
└── Can: Assign pembimbing, validate judul, view prodi reports

DOSEN (Tier 1)
├── Akses: Mahasiswa ASSIGNED saja
└── Can: Manage bimbingan, input nilai (untuk assigned mahasiswa)
```

## ✅ Business Rules Enforced

1. **Pembimbing**: Max 4 mahasiswa per dosen
2. **Pembimbing**: P1 ≠ P2
3. **Penguji**: 3 penguji berbeda
4. **Penguji**: No capacity limit
5. **Kaprodi**: Auto-filter by prodi
6. **Dosen**: Auto-filter by assignment

## 🔧 Next Steps

1. Apply RBAC ke semua existing routes
2. Update semua pages dengan role-based content
3. Add monitoring dashboard
4. Test semua scenarios

## 📚 Full Documentation

Lihat `RBAC_IMPLEMENTATION.md` untuk dokumentasi lengkap.
