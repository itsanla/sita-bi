# 🧪 SITA-BI Testing Guide

## Quick Start

### 1. Setup Database
```bash
./seed-database.sh
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

### 3. Access Application
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002

## 🔑 Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@pnp.ac.id | password123 | Full system access |
| Kajur | kajur@pnp.ac.id | password123 | All prodi access |
| Kaprodi D3 | kaprodi.d3@pnp.ac.id | password123 | D3 students only |
| Kaprodi D4 | kaprodi.d4@pnp.ac.id | password123 | D4 students only |
| Dosen | rina.wati@pnp.ac.id | password123 | Teaching & guidance |
| Mahasiswa | 2101010001@student.pnp.ac.id | password123 | Student view |

## 🎯 Testing Scenarios

### Scenario 1: Penugasan Pembimbing (Admin/Kajur)

**Objective**: Test assignment of supervisors to students

**Steps**:
1. Login as `admin@pnp.ac.id`
2. Navigate to `/dashboard/admin/penugasan`
3. You should see 5 students with approved TA (status: DISETUJUI)
4. Click "Assign Pembimbing" for first student
5. Select Pembimbing 1: `Rina Wati` (should show 0/4)
6. Select Pembimbing 2: `Agus Setiawan` (should show 0/4)
7. Click "Simpan Penugasan"

**Expected Result**:
- ✅ Assignment successful
- ✅ Student disappears from unassigned list
- ✅ Dosen capacity updated (1/4)

**Test Edge Cases**:
- Try assigning 5th student to same dosen → Should fail (quota full)
- Try assigning same dosen as both pembimbing → Should fail
- Try assigning without selecting dosen → Should show error

### Scenario 2: Kuota Dosen (Admin/Kajur)

**Objective**: Test 4-student quota per supervisor

**Steps**:
1. Login as `admin@pnp.ac.id`
2. Assign 4 students to `Rina Wati` as Pembimbing 1
3. Try to assign 5th student to `Rina Wati`

**Expected Result**:
- ✅ First 4 assignments successful
- ✅ 5th assignment fails with error: "Pembimbing 1 sudah membimbing 4 mahasiswa (kuota penuh)"
- ✅ Rina Wati shows as "(PENUH)" in dropdown

### Scenario 3: Role-Based Access (Kaprodi)

**Objective**: Test prodi-specific access control

**Steps**:
1. Login as `kaprodi.d3@pnp.ac.id`
2. Navigate to `/dashboard/admin/users`
3. Filter by "Mahasiswa"

**Expected Result**:
- ✅ Only see D3 students (NIM: 2201010xxx)
- ✅ Cannot see D4 students (NIM: 2101010xxx)

**Repeat for Kaprodi D4**:
- ✅ Only see D4 students
- ✅ Cannot see D3 students

### Scenario 4: Dosen Bimbingan View

**Objective**: Test supervisor's view of assigned students

**Steps**:
1. First, assign students to `rina.wati@pnp.ac.id` (as admin)
2. Logout and login as `rina.wati@pnp.ac.id`
3. Navigate to `/dashboard/dosen/bimbingan`

**Expected Result**:
- ✅ See list of assigned students
- ✅ Can view student details
- ✅ Can add guidance notes

### Scenario 5: Mahasiswa Dashboard

**Objective**: Test student view of their TA

**Steps**:
1. Login as `2101010006@student.pnp.ac.id` (has TA in BIMBINGAN status)
2. Navigate to `/dashboard/mahasiswa/tugas-akhir`

**Expected Result**:
- ✅ See TA title
- ✅ See assigned supervisors (Pembimbing 1 & 2)
- ✅ See TA status: BIMBINGAN

### Scenario 6: Approval Workflow (Kaprodi)

**Objective**: Test TA approval process

**Steps**:
1. Login as `2201010001@student.pnp.ac.id` (has TA in DRAFT status)
2. Submit TA for approval
3. Logout and login as `kaprodi.d3@pnp.ac.id`
4. Navigate to approval page
5. Approve or reject the TA

**Expected Result**:
- ✅ Kaprodi can see pending TA
- ✅ Can approve → status changes to DISETUJUI
- ✅ Can reject → status changes to DITOLAK

## 🐛 Common Issues & Solutions

### Issue 1: "No unassigned TA found"
**Solution**: Check if all 5 DISETUJUI TAs have been assigned. Re-run seeder to reset.

### Issue 2: "Dosen not showing in dropdown"
**Solution**: Check if dosen has reached quota (4/4). Use different dosen or re-run seeder.

### Issue 3: "Cannot login"
**Solution**: 
- Verify password is `password123`
- Check if seeder ran successfully
- Check backend is running on port 3002

### Issue 4: "Empty dashboard"
**Solution**: 
- Re-run seeder: `./seed-database.sh`
- Check database: `cd packages/db && npx prisma studio`

## 📊 Data Verification

### Check Database State
```bash
cd packages/db
npx prisma studio
```

### Verify Seeder Data
```sql
-- Check users by role
SELECT r.name as role, COUNT(*) as count 
FROM users u 
JOIN _RoleToUser ru ON u.id = ru.B 
JOIN roles r ON ru.A = r.id 
GROUP BY r.name;

-- Check TA by status
SELECT status, COUNT(*) as count 
FROM tugas_akhir 
GROUP BY status;

-- Check dosen workload
SELECT 
  u.name,
  COUNT(pdt.id) as total_assignments
FROM users u
JOIN dosen d ON u.id = d.user_id
LEFT JOIN peran_dosen_ta pdt ON d.id = pdt.dosen_id
GROUP BY u.name
ORDER BY total_assignments DESC;
```

## 🔄 Reset & Retry

If something goes wrong, reset everything:

```bash
# Stop all services
# Ctrl+C in both terminals

# Reset database
./seed-database.sh

# Restart services
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

## 📝 Test Checklist

- [ ] Admin can login
- [ ] Kajur can login
- [ ] Kaprodi D3 can login (only see D3 students)
- [ ] Kaprodi D4 can login (only see D4 students)
- [ ] Dosen can login
- [ ] Mahasiswa can login
- [ ] Admin can assign pembimbing
- [ ] Kuota 4 mahasiswa enforced
- [ ] Cannot assign same dosen twice
- [ ] Dosen can see assigned students
- [ ] Mahasiswa can see their TA
- [ ] Kaprodi can approve TA
- [ ] Dashboard shows correct data for each role

## 🎓 Learning Resources

- **Prisma Studio**: Visual database browser
- **API Docs**: Check `apps/api/src/api/` for endpoints
- **Frontend Routes**: Check `apps/web/app/dashboard/` for pages

## 💡 Tips

1. **Use Prisma Studio** to verify data changes in real-time
2. **Check browser console** for frontend errors
3. **Check terminal logs** for backend errors
4. **Use different browsers** for testing multiple roles simultaneously
5. **Clear browser cache** if seeing stale data

## 🆘 Need Help?

1. Check `SEEDER_README.md` for seeder details
2. Check `RBAC_README.md` for role permissions
3. Check browser DevTools Network tab for API errors
4. Check backend terminal for error logs
