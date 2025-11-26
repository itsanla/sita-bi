# RBAC Migration Guide

Panduan untuk migrate existing code ke sistem RBAC yang baru.

---

## 🎯 Migration Strategy

### Phase 1: Backend Routes (Priority: HIGH)
Tambahkan middleware RBAC ke routes yang sensitif.

### Phase 2: Frontend Pages (Priority: HIGH)
Wrap pages dengan RouteGuard untuk proteksi.

### Phase 3: UI Components (Priority: MEDIUM)
Add conditional rendering dengan RBACGuard.

### Phase 4: Data Filtering (Priority: MEDIUM)
Implement filtering by prodi scope.

### Phase 5: Forms (Priority: LOW)
Replace manual selectors dengan RBAC components.

---

## 📝 Step-by-Step Migration

### STEP 1: Update Backend Routes

#### 1.1 Import Middleware
```typescript
// Add to top of router file
import { 
  validateProdiScope,
  validateDosenMahasiswaRelation,
  validateDosenTugasAkhirAccess 
} from '../middlewares/rbac.middleware';
```

#### 1.2 Apply to Routes
```typescript
// BEFORE
router.get('/mahasiswa', authMiddleware, handler);

// AFTER
router.get('/mahasiswa', 
  authMiddleware,
  validateProdiScope(),  // Add this
  handler
);
```

#### Routes to Update:
```typescript
// apps/api/src/api/tugas-akhir.router.ts
router.get('/:id', authMiddleware, validateDosenTugasAkhirAccess, handler);
router.patch('/:id', authMiddleware, validateDosenTugasAkhirAccess, handler);

// apps/api/src/api/bimbingan.router.ts
router.post('/:mahasiswaId', authMiddleware, validateDosenMahasiswaRelation, handler);
router.get('/:mahasiswaId', authMiddleware, validateDosenMahasiswaRelation, handler);

// apps/api/src/api/penilaian.router.ts
router.post('/:tugasAkhirId', authMiddleware, validateDosenTugasAkhirAccess, handler);

// apps/api/src/api/users.router.ts
router.get('/mahasiswa', authMiddleware, validateProdiScope(), handler);
```

### STEP 2: Update Frontend Pages

#### 2.1 Import RouteGuard
```typescript
import { RouteGuard } from '@/components/shared/RouteGuard';
```

#### 2.2 Wrap Page Content
```typescript
// BEFORE
export default function AdminPage() {
  return <div>Content</div>;
}

// AFTER
export default function AdminPage() {
  return (
    <RouteGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4']}>
      <div>Content</div>
    </RouteGuard>
  );
}
```

#### Pages to Update:
```typescript
// Admin pages - Require kajur/kaprodi
apps/web/app/dashboard/admin/users/page.tsx
apps/web/app/dashboard/admin/jadwal-sidang/page.tsx
apps/web/app/dashboard/admin/pengumuman/page.tsx
apps/web/app/admin/penjadwalan-sidang/page.tsx
apps/web/app/admin/reports/page.tsx

// Dosen pages - Require dosen
apps/web/app/dashboard/dosen/bimbingan/page.tsx
apps/web/app/dashboard/dosen/penilaian/page.tsx

// Mahasiswa pages - Require mahasiswa
apps/web/app/dashboard/mahasiswa/tugas-akhir/page.tsx
apps/web/app/dashboard/mahasiswa/bimbingan/page.tsx
```

### STEP 3: Add Conditional UI

#### 3.1 Import Guards
```typescript
import { RBACGuard, PermissionGuard } from '@/components/shared/RBACGuard';
import { useRBAC } from '@/hooks/useRBAC';
```

#### 3.2 Wrap UI Elements
```typescript
// BEFORE
<button onClick={handleDelete}>Delete</button>

// AFTER
<RBACGuard allowedRoles={['kajur', 'admin']}>
  <button onClick={handleDelete}>Delete</button>
</RBACGuard>

// OR with permission
<PermissionGuard permission="canManageUsers">
  <button onClick={handleDelete}>Delete</button>
</PermissionGuard>
```

#### Common Patterns:
```typescript
// Navigation items
<RBACGuard allowedRoles={['kajur', 'kaprodi_d3', 'kaprodi_d4']}>
  <Link href="/admin">Admin Panel</Link>
</RBACGuard>

// Action buttons
<RBACGuard allowedRoles={['kajur']}>
  <button>Delete User</button>
</RBACGuard>

// Sections
<PermissionGuard permission="canAccessReports">
  <ReportsSection />
</PermissionGuard>
```

### STEP 4: Implement Data Filtering

#### 4.1 Import Utilities
```typescript
import { useRBAC } from '@/hooks/useRBAC';
import { filterByProdi } from '@/lib/rbac-utils';
```

#### 4.2 Filter Data
```typescript
// BEFORE
const { data: mahasiswa } = useMahasiswa();

return (
  <table>
    {mahasiswa?.map(m => <tr key={m.id}>...</tr>)}
  </table>
);

// AFTER
const { role, prodi } = useRBAC();
const { data: allMahasiswa } = useMahasiswa();

const filteredMahasiswa = filterByProdi(allMahasiswa || [], prodi, role);

return (
  <table>
    {filteredMahasiswa.map(m => <tr key={m.id}>...</tr>)}
  </table>
);
```

#### Lists to Filter:
- Mahasiswa lists
- Tugas akhir lists
- Bimbingan lists
- Reports data
- Statistics

### STEP 5: Replace Form Selectors

#### 5.1 Pembimbing Selection
```typescript
// BEFORE
<select value={pembimbing1} onChange={e => setPembimbing1(e.target.value)}>
  {dosen.map(d => <option value={d.id}>{d.name}</option>)}
</select>

// AFTER
import { PembimbingSelector } from '@/components/admin/PembimbingSelector';

<PembimbingSelector
  value={{ pembimbing1Id, pembimbing2Id }}
  onChange={setPembimbing}
  mahasiswaProdi={mahasiswa.prodi}
/>
```

#### 5.2 Penguji Selection
```typescript
// BEFORE
<select value={penguji1} onChange={e => setPenguji1(e.target.value)}>
  {dosen.map(d => <option value={d.id}>{d.name}</option>)}
</select>

// AFTER
import { PengujiSelector } from '@/components/admin/PengujiSelector';

<PengujiSelector
  value={{ penguji1Id, penguji2Id, penguji3Id }}
  onChange={setPenguji}
/>
```

---

## 🔍 Migration Checklist

### Backend
- [ ] Import RBAC middleware ke semua routers
- [ ] Apply `validateProdiScope()` ke mahasiswa routes
- [ ] Apply `validateDosenMahasiswaRelation()` ke bimbingan routes
- [ ] Apply `validateDosenTugasAkhirAccess()` ke TA routes
- [ ] Test dengan Postman/curl untuk setiap role
- [ ] Verify 403 responses untuk unauthorized access

### Frontend - Pages
- [ ] Wrap admin pages dengan RouteGuard
- [ ] Wrap dosen pages dengan RouteGuard
- [ ] Wrap mahasiswa pages dengan RouteGuard
- [ ] Test navigation untuk setiap role
- [ ] Verify redirect untuk unauthorized users

### Frontend - Components
- [ ] Add RBACGuard ke navigation menu
- [ ] Add RBACGuard ke action buttons
- [ ] Add PermissionGuard ke sections
- [ ] Replace manual dosen selectors
- [ ] Add capacity indicators
- [ ] Test conditional rendering

### Frontend - Data
- [ ] Implement filterByProdi untuk lists
- [ ] Filter mahasiswa by scope
- [ ] Filter tugas akhir by scope
- [ ] Filter reports by scope
- [ ] Test data visibility per role

### Testing
- [ ] Test as Kajur - verify full access
- [ ] Test as Kaprodi D3 - verify D3 only
- [ ] Test as Kaprodi D4 - verify D4 only
- [ ] Test as Dosen - verify assigned only
- [ ] Test as Mahasiswa - verify own data only
- [ ] Test capacity validation
- [ ] Test team composition validation

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Check Role
```typescript
// ❌ BAD
if (user.roles[0].name === 'kajur') { ... }

// ✅ GOOD
const { isKajur } = useRBAC();
if (isKajur) { ... }
```

### Pitfall 2: Not Filtering Data
```typescript
// ❌ BAD - Shows all data
const { data } = useMahasiswa();

// ✅ GOOD - Filtered by scope
const { role, prodi } = useRBAC();
const { data: allData } = useMahasiswa();
const filtered = filterByProdi(allData, prodi, role);
```

### Pitfall 3: Manual Capacity Check
```typescript
// ❌ BAD - Manual check
const count = await countBimbingan(dosenId);
if (count >= 4) { ... }

// ✅ GOOD - Use helper
const capacity = await getDosenCapacity(dosenId);
if (capacity.current >= capacity.max) { ... }
```

### Pitfall 4: Inconsistent Validation
```typescript
// ❌ BAD - Only frontend validation
if (p1 === p2) { toast.error('Must be different'); }

// ✅ GOOD - Both frontend & backend
// Frontend
const validation = validatePembimbingSelection(p1, p2);
if (!validation.isValid) { ... }

// Backend
const validation = await validateTeamComposition(p1, p2);
if (!validation.isValid) { throw error; }
```

---

## 📊 Migration Progress Tracker

### Backend Routes
- [ ] `/api/tugas-akhir/*` (5 routes)
- [ ] `/api/bimbingan/*` (8 routes)
- [ ] `/api/penilaian/*` (3 routes)
- [ ] `/api/users/mahasiswa` (1 route)
- [ ] `/api/pendaftaran-sidang/*` (4 routes)

### Frontend Pages
- [ ] Admin pages (5 pages)
- [ ] Dosen pages (3 pages)
- [ ] Mahasiswa pages (4 pages)

### Frontend Components
- [ ] Navigation menu (1 component)
- [ ] User management (1 page)
- [ ] Assign pembimbing (2 forms)
- [ ] Assign penguji (1 form)
- [ ] Mahasiswa lists (3 components)

### Data Filtering
- [ ] Mahasiswa list
- [ ] Tugas akhir list
- [ ] Bimbingan list
- [ ] Reports
- [ ] Dashboard stats

---

## 🎯 Priority Order

### Week 1: Critical (Security)
1. ✅ Backend middleware implementation
2. ✅ Frontend RouteGuard implementation
3. Test basic access control

### Week 2: Important (UX)
4. Add conditional UI (RBACGuard)
5. Implement data filtering
6. Test user experience per role

### Week 3: Enhancement (Features)
7. Replace form selectors
8. Add capacity indicators
9. Polish UI/UX

### Week 4: Testing & Documentation
10. Comprehensive testing
11. Update user documentation
12. Training for team

---

## 🔧 Quick Commands

### Test Backend
```bash
# Test as Kajur
curl -H "x-user-id: 1" http://localhost:3002/api/mahasiswa

# Test as Kaprodi D3
curl -H "x-user-id: 2" http://localhost:3002/api/mahasiswa

# Test as Dosen
curl -H "x-user-id: 3" http://localhost:3002/api/mahasiswa
```

### Test Frontend
```bash
# Run dev server
cd apps/web
pnpm dev

# Login as different roles and test navigation
```

---

## 📞 Need Help?

Refer to:
1. **RBAC_IMPLEMENTATION.md** - Full implementation details
2. **RBAC_QUICK_REFERENCE.md** - Quick API reference
3. **RBAC_EXAMPLE_IMPLEMENTATION.md** - Code examples
4. **RBAC_IMPLEMENTATION_SUMMARY.md** - Overview

---

**Good luck with migration! 🚀**
