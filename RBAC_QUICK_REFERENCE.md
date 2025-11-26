# RBAC Quick Reference

## 🎯 Role Hierarchy

```
KAJUR (Tier 3)
  ├─ Akses: UNLIMITED
  ├─ Scope: Semua prodi (D3 + D4)
  └─ Inherit: Semua permission Kaprodi + Dosen

KAPRODI (Tier 2)
  ├─ Akses: PRODI SCOPE
  ├─ Scope: 1 prodi (D3 atau D4)
  └─ Inherit: Semua permission Dosen (dalam scope)

DOSEN (Tier 1)
  ├─ Akses: ASSIGNED ONLY
  ├─ Scope: Mahasiswa assigned saja
  └─ Permission: Bimbingan & Penilaian
```

## 📦 Files Created

### Backend
```
apps/api/src/
├── middlewares/rbac.middleware.ts       # RBAC middleware
├── utils/rbac-helpers.ts                # Helper functions
└── api/rbac.router.ts                   # RBAC endpoints
```

### Frontend
```
apps/web/
├── types/rbac.ts                        # Type definitions
├── hooks/
│   ├── useRBAC.ts                       # Main RBAC hook
│   └── useDosenCapacity.ts              # Capacity hook
├── lib/rbac-utils.ts                    # Utility functions
└── components/
    ├── shared/
    │   ├── RBACGuard.tsx                # Conditional render
    │   └── RouteGuard.tsx               # Route protection
    └── admin/
        ├── DosenCapacityIndicator.tsx   # Capacity UI
        ├── PembimbingSelector.tsx       # Pembimbing form
        └── PengujiSelector.tsx          # Penguji form
```

## 🔑 Key Functions

### Backend
```typescript
// Middleware
validateProdiScope()                     // Check prodi scope
validateDosenMahasiswaRelation()         // Check dosen-mhs relation
validateDosenTugasAkhirAccess()          // Check TA access
validatePembimbingCapacity(dosenId)      // Check capacity

// Helpers
getUserRBACData(userId)                  // Get RBAC data
canAccessMahasiswa(role, prodi, dosenId, mhsId)
getAccessibleMahasiswaIds(role, prodi, dosenId)
getDosenCapacity(dosenId)
validateTeamComposition(p1, p2, pg1, pg2, pg3)
```

### Frontend
```typescript
// Hook
const { role, prodi, isKajur, isKaprodi, isDosen,
        canAssignPembimbing, canAccessMahasiswa } = useRBAC();

// Utils
getRoleDisplayName(role)
getProdiDisplayName(prodi)
filterByProdi(items, prodi, role)
canEditMahasiswa(role, prodi, mhsProdi)
getDosenCapacityColor(current, max)
getDosenCapacityBadge(current, max)
validatePembimbingSelection(p1, p2)
validatePengujiSelection(pg1, pg2, pg3)
```

## 💡 Common Patterns

### 1. Protect Route
```tsx
<RouteGuard allowedRoles={['kajur', 'kaprodi_d3']}>
  <AdminPage />
</RouteGuard>
```

### 2. Conditional UI
```tsx
<RBACGuard allowedRoles={['kajur']}>
  <DeleteButton />
</RBACGuard>

<PermissionGuard permission="canAssignPembimbing">
  <AssignForm />
</PermissionGuard>
```

### 3. Check Permission
```tsx
const { canAssignPembimbing, isKajur } = useRBAC();

if (isKajur) {
  // Kajur logic
}

if (canAssignPembimbing) {
  // Show assign button
}
```

### 4. Filter Data
```tsx
const { role, prodi } = useRBAC();
const filtered = filterByProdi(allData, prodi, role);
```

### 5. Backend Middleware
```typescript
router.get('/mahasiswa',
  authMiddleware,
  validateProdiScope(),
  handler
);

router.post('/bimbingan/:mahasiswaId',
  authMiddleware,
  validateDosenMahasiswaRelation,
  handler
);
```

## 🎨 UI Components

### Capacity Indicator
```tsx
<DosenCapacityIndicator current={3} max={4} />
// Output: "3/4" + Badge (Tersedia/Hampir Penuh/Penuh)
```

### Pembimbing Selector
```tsx
<PembimbingSelector
  value={{ pembimbing1Id, pembimbing2Id }}
  onChange={setPembimbing}
  mahasiswaProdi="D3"
/>
// Auto-validate capacity & uniqueness
```

### Penguji Selector
```tsx
<PengujiSelector
  value={{ penguji1Id, penguji2Id, penguji3Id }}
  onChange={setPenguji}
/>
// Auto-validate uniqueness
```

## ⚡ Quick Checks

### Can user access mahasiswa?
```typescript
const { canAccessMahasiswa } = useRBAC();
if (canAccessMahasiswa(mahasiswaId)) {
  // Show data
}
```

### Can user edit?
```typescript
const { role, prodi } = useRBAC();
if (canEditMahasiswa(role, prodi, mahasiswa.prodi)) {
  // Show edit button
}
```

### Is dosen full?
```typescript
const { data: capacity } = useDosenCapacityById(dosenId);
if (capacity.current >= capacity.max) {
  // Disable selection
}
```

## 🚦 Business Rules

### Pembimbing
- ✅ Max 4 mahasiswa per dosen
- ✅ P1 ≠ P2
- ✅ Capacity check before assign
- ✅ Warning at 3/4

### Penguji
- ✅ 3 penguji must be different
- ✅ No capacity limit
- ✅ Min 1 required

### Access
- ✅ Kajur: all access
- ✅ Kaprodi: prodi scope
- ✅ Dosen: assigned only

## 📍 API Endpoints

```
GET  /api/rbac/me                        # Get user RBAC data
GET  /api/rbac/dosen/:id/capacity        # Get dosen capacity
GET  /api/rbac/dosen/capacity/all        # Get all dosen capacity
```

## 🔧 Integration Steps

1. **Wrap page with RouteGuard**
2. **Use useRBAC() for permissions**
3. **Add RBACGuard for conditional UI**
4. **Use filterByProdi() for data**
5. **Apply backend middleware**

---

**Quick Start**: Import `useRBAC()` dan mulai check permissions!
