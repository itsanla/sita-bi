# RBAC Example Implementation

## Example 1: Admin Page - Assign Pembimbing

### Before RBAC
```tsx
// ❌ No access control
export default function AssignPembimbingPage() {
  const [pembimbing1, setPembimbing1] = useState(null);
  const [pembimbing2, setPembimbing2] = useState(null);

  return (
    <div>
      <h1>Assign Pembimbing</h1>
      <select onChange={(e) => setPembimbing1(e.target.value)}>
        {/* All dosen, no capacity check */}
      </select>
    </div>
  );
}
```

### After RBAC
```tsx
// ✅ Full RBAC implementation
'use client';

import { RouteGuard } from '@/components/shared/RouteGuard';
import { PembimbingSelector } from '@/components/admin/PembimbingSelector';
import { useRBAC } from '@/hooks/useRBAC';
import { useState } from 'react';

export default function AssignPembimbingPage() {
  const { canAssignPembimbing, prodi } = useRBAC();
  const [pembimbing, setPembimbing] = useState({
    pembimbing1Id: null,
    pembimbing2Id: null,
  });

  return (
    <RouteGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4', 'admin']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Assign Pembimbing</h1>
        
        {canAssignPembimbing ? (
          <PembimbingSelector
            value={pembimbing}
            onChange={setPembimbing}
            mahasiswaProdi={prodi}
          />
        ) : (
          <div className="text-red-600">
            Anda tidak memiliki izin untuk assign pembimbing
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
```

## Example 2: Mahasiswa List with Filtering

### Before RBAC
```tsx
// ❌ Shows all mahasiswa to everyone
export default function MahasiswaListPage() {
  const { data: mahasiswa } = useMahasiswa();

  return (
    <table>
      {mahasiswa?.map(m => (
        <tr key={m.id}>
          <td>{m.nim}</td>
          <td>{m.name}</td>
          <td>{m.prodi}</td>
        </tr>
      ))}
    </table>
  );
}
```

### After RBAC
```tsx
// ✅ Filtered by role & scope
'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { filterByProdi } from '@/lib/rbac-utils';
import { RBACGuard } from '@/components/shared/RBACGuard';

export default function MahasiswaListPage() {
  const { role, prodi, canAccessMahasiswa, isKajur } = useRBAC();
  const { data: allMahasiswa } = useMahasiswa();

  // Filter by prodi scope
  const filteredMahasiswa = filterByProdi(allMahasiswa || [], prodi, role);

  // For dosen, further filter by assignments
  const accessibleMahasiswa = isKajur 
    ? filteredMahasiswa
    : filteredMahasiswa.filter(m => canAccessMahasiswa(m.id));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Daftar Mahasiswa</h1>
        
        <RBACGuard allowedRoles={['kajur', 'admin']}>
          <button className="btn-primary">Tambah Mahasiswa</button>
        </RBACGuard>
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th>NIM</th>
            <th>Nama</th>
            <th>Prodi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {accessibleMahasiswa.map(m => (
            <tr key={m.id}>
              <td>{m.nim}</td>
              <td>{m.name}</td>
              <td>{m.prodi}</td>
              <td>
                <RBACGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4']}>
                  <button>Edit</button>
                </RBACGuard>
                <button>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Example 3: Dashboard with Role-Based Content

### Before RBAC
```tsx
// ❌ Same dashboard for everyone
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <StatsCard />
      <RecentActivity />
    </div>
  );
}
```

### After RBAC
```tsx
// ✅ Different content per role
'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { PermissionGuard } from '@/components/shared/RBACGuard';

export default function DashboardPage() {
  const { role, isKajur, isKaprodi, isDosen, isMahasiswa } = useRBAC();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Dashboard {role && `- ${getRoleDisplayName(role)}`}
      </h1>

      {/* Kajur Dashboard */}
      {isKajur ? (
        <div className="space-y-6">
          <StatsOverview scope="all" />
          <ReportsSection />
          <ApprovalQueue />
          <DosenWorkloadChart />
        </div>
      ) : null}

      {/* Kaprodi Dashboard */}
      {isKaprodi ? (
        <div className="space-y-6">
          <StatsOverview scope="prodi" />
          <PendingApprovals />
          <ProdiReports />
        </div>
      ) : null}

      {/* Dosen Dashboard */}
      {isDosen ? (
        <div className="space-y-6">
          <MyBimbinganList />
          <MyPengujiList />
          <UpcomingSchedule />
        </div>
      ) : null}

      {/* Mahasiswa Dashboard */}
      {isMahasiswa ? (
        <div className="space-y-6">
          <MyThesisProgress />
          <BimbinganSchedule />
          <UpcomingDeadlines />
        </div>
      ) : null}

      {/* Common sections with permission guards */}
      <PermissionGuard permission="canAccessReports">
        <ReportsSection />
      </PermissionGuard>

      <PermissionGuard permission="canManagePenjadwalan">
        <SchedulingPanel />
      </PermissionGuard>
    </div>
  );
}
```

## Example 4: Navigation Menu with RBAC

### Before RBAC
```tsx
// ❌ All menu items visible to everyone
export function Sidebar() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/mahasiswa">Mahasiswa</Link>
      <Link href="/dosen">Dosen</Link>
      <Link href="/assign">Assign Pembimbing</Link>
      <Link href="/reports">Reports</Link>
      <Link href="/users">User Management</Link>
    </nav>
  );
}
```

### After RBAC
```tsx
// ✅ Menu items filtered by permissions
'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { RBACGuard } from '@/components/shared/RBACGuard';
import Link from 'next/link';

export function Sidebar() {
  const { 
    canViewAllMahasiswa, 
    canAssignPembimbing, 
    canAccessReports,
    canManageUsers,
    isDosen,
    isMahasiswa 
  } = useRBAC();

  return (
    <nav className="space-y-2">
      {/* Always visible */}
      <Link href="/dashboard" className="nav-item">
        Dashboard
      </Link>

      {/* Kajur, Kaprodi, Dosen */}
      <RBACGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4', 'dosen']}>
        <Link href="/mahasiswa" className="nav-item">
          {canViewAllMahasiswa ? 'Semua Mahasiswa' : 'Mahasiswa Bimbingan'}
        </Link>
      </RBACGuard>

      {/* Dosen specific */}
      {isDosen ? (
        <>
          <Link href="/bimbingan" className="nav-item">
            Bimbingan Saya
          </Link>
          <Link href="/penilaian" className="nav-item">
            Penilaian
          </Link>
        </>
      ) : null}

      {/* Mahasiswa specific */}
      {isMahasiswa ? (
        <>
          <Link href="/tugas-akhir" className="nav-item">
            Tugas Akhir Saya
          </Link>
          <Link href="/bimbingan" className="nav-item">
            Jadwal Bimbingan
          </Link>
        </>
      ) : null}

      {/* Admin functions */}
      {canAssignPembimbing ? (
        <Link href="/assign" className="nav-item">
          Assign Pembimbing
        </Link>
      ) : null}

      {canAccessReports ? (
        <Link href="/reports" className="nav-item">
          Laporan
        </Link>
      ) : null}

      {canManageUsers ? (
        <Link href="/users" className="nav-item">
          Kelola Pengguna
        </Link>
      ) : null}
    </nav>
  );
}
```

## Example 5: Backend Route Protection

### Before RBAC
```typescript
// ❌ No authorization check
router.get('/mahasiswa/:id', authMiddleware, async (req, res) => {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: parseInt(req.params.id) }
  });
  res.json({ data: mahasiswa });
});
```

### After RBAC
```typescript
// ✅ Full authorization with scope & relationship checks
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateDosenMahasiswaRelation } from '../middlewares/rbac.middleware';
import { canAccessMahasiswa } from '../utils/rbac-helpers';

router.get(
  '/mahasiswa/:id',
  authMiddleware,
  async (req, res) => {
    const mahasiswaId = parseInt(req.params.id);
    const user = req.user!;

    // Check access permission
    const hasAccess = await canAccessMahasiswa(
      user.role,
      user.dosen?.prodi,
      user.dosen?.id,
      mahasiswaId
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses ke mahasiswa ini' 
      });
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
      include: {
        user: true,
        tugasAkhir: {
          include: {
            peranDosenTa: {
              where: user.dosen ? { dosen_id: user.dosen.id } : undefined
            }
          }
        }
      }
    });

    res.json({ data: mahasiswa });
  }
);

// Or use middleware for cleaner code
router.post(
  '/bimbingan/:mahasiswaId',
  authMiddleware,
  validateDosenMahasiswaRelation, // Auto-checks relationship
  async (req, res) => {
    // Handler - access already validated
    const mahasiswaId = parseInt(req.params.mahasiswaId);
    // ... create bimbingan
  }
);
```

## Example 6: Form with Capacity Validation

### Before RBAC
```tsx
// ❌ No capacity check
export function AssignForm({ tugasAkhirId }) {
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);

  const handleSubmit = async () => {
    await api.post('/penugasan/assign', {
      tugasAkhirId,
      pembimbing1Id: p1,
      pembimbing2Id: p2,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={p1} onChange={(e) => setP1(e.target.value)}>
        {/* No capacity info */}
      </select>
      <button type="submit">Assign</button>
    </form>
  );
}
```

### After RBAC
```tsx
// ✅ Full validation with capacity check
'use client';

import { PembimbingSelector } from '@/components/admin/PembimbingSelector';
import { validatePembimbingSelection } from '@/lib/rbac-utils';
import { useState } from 'react';
import { toast } from 'sonner';

export function AssignForm({ tugasAkhirId, mahasiswaProdi }) {
  const [pembimbing, setPembimbing] = useState({
    pembimbing1Id: null,
    pembimbing2Id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate selection
    const validation = validatePembimbingSelection(
      pembimbing.pembimbing1Id,
      pembimbing.pembimbing2Id
    );

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/penugasan/assign', {
        tugasAkhirId,
        ...pembimbing,
      });
      toast.success('Pembimbing berhasil di-assign');
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PembimbingSelector
        value={pembimbing}
        onChange={setPembimbing}
        mahasiswaProdi={mahasiswaProdi}
      />

      <button
        type="submit"
        disabled={isSubmitting || !pembimbing.pembimbing1Id}
        className="btn-primary"
      >
        {isSubmitting ? 'Menyimpan...' : 'Assign Pembimbing'}
      </button>
    </form>
  );
}
```

---

## 🎯 Key Takeaways

1. **Always use RouteGuard** untuk page-level protection
2. **Use useRBAC()** untuk get permissions & role info
3. **Use RBACGuard** untuk conditional rendering
4. **Use filterByProdi()** untuk data filtering
5. **Use PembimbingSelector** untuk assignment dengan capacity check
6. **Apply backend middleware** untuk enforce authorization
7. **Validate on both sides** - frontend (UX) + backend (security)

---

**Next**: Apply patterns ini ke semua pages yang ada!
