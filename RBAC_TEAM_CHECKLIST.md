# RBAC Implementation Checklist

Checklist untuk tim dalam mengimplementasikan RBAC ke existing code.

---

## 📋 Phase 1: Understanding (Week 1)

### Day 1: Documentation Review
- [ ] Read **RBAC_README.md** (5 min)
- [ ] Read **RBAC_FINAL_REPORT.md** (15 min)
- [ ] Understand role hierarchy
- [ ] Understand business rules

### Day 2: Technical Deep Dive
- [ ] Read **RBAC_IMPLEMENTATION.md** (30 min)
- [ ] Review backend middleware
- [ ] Review frontend components
- [ ] Understand data flow

### Day 3: Examples & Patterns
- [ ] Read **RBAC_EXAMPLE_IMPLEMENTATION.md** (30 min)
- [ ] Study before/after examples
- [ ] Understand common patterns
- [ ] Note anti-patterns

### Day 4: Migration Planning
- [ ] Read **RBAC_MIGRATION_GUIDE.md** (20 min)
- [ ] List routes to protect
- [ ] List pages to guard
- [ ] List components to update

### Day 5: Team Sync
- [ ] Team meeting: Review understanding
- [ ] Assign responsibilities
- [ ] Set timeline
- [ ] Create task board

---

## 🔧 Phase 2: Backend Implementation (Week 2)

### Backend Routes Protection

#### Priority: CRITICAL
- [ ] `/api/tugas-akhir/:id` - Add `validateDosenTugasAkhirAccess`
- [ ] `/api/tugas-akhir/:id` (PATCH) - Add `validateDosenTugasAkhirAccess`
- [ ] `/api/bimbingan/:mahasiswaId` - Add `validateDosenMahasiswaRelation`
- [ ] `/api/penilaian/:tugasAkhirId` - Add `validateDosenTugasAkhirAccess`

#### Priority: HIGH
- [ ] `/api/users/mahasiswa` - Add `validateProdiScope()`
- [ ] `/api/pendaftaran-sidang/*` - Add appropriate middleware
- [ ] `/api/jadwal-sidang/*` - Add appropriate middleware

#### Priority: MEDIUM
- [ ] `/api/pengumuman/*` - Add role checks
- [ ] `/api/laporan/*` - Add scope validation
- [ ] `/api/dashboard/*` - Add data filtering

### Backend Testing
- [ ] Test as Kajur - verify full access
- [ ] Test as Kaprodi D3 - verify D3 only
- [ ] Test as Kaprodi D4 - verify D4 only
- [ ] Test as Dosen - verify assigned only
- [ ] Test unauthorized access - verify 403
- [ ] Test capacity validation
- [ ] Test team composition validation

### Backend Documentation
- [ ] Update API documentation
- [ ] Document new endpoints
- [ ] Update Postman collection

---

## 🎨 Phase 3: Frontend Pages (Week 3)

### Admin Pages
- [ ] `/dashboard/admin/users/page.tsx` - Add RouteGuard
- [ ] `/dashboard/admin/jadwal-sidang/page.tsx` - Add RouteGuard
- [ ] `/dashboard/admin/pengumuman/page.tsx` - Add RouteGuard
- [ ] `/admin/penjadwalan-sidang/page.tsx` - Add RouteGuard
- [ ] `/admin/reports/page.tsx` - Add RouteGuard

### Dosen Pages
- [ ] `/dashboard/dosen/bimbingan/page.tsx` - Add RouteGuard
- [ ] `/dashboard/dosen/penilaian/page.tsx` - Add RouteGuard

### Mahasiswa Pages
- [ ] `/dashboard/mahasiswa/tugas-akhir/page.tsx` - Add RouteGuard
- [ ] `/dashboard/mahasiswa/bimbingan/page.tsx` - Add RouteGuard

### Frontend Testing
- [ ] Test navigation as each role
- [ ] Verify redirects work
- [ ] Test loading states
- [ ] Verify error messages

---

## 🎯 Phase 4: UI Components (Week 4)

### Navigation Menu
- [ ] Add RBACGuard to admin menu items
- [ ] Add RBACGuard to dosen menu items
- [ ] Add RBACGuard to mahasiswa menu items
- [ ] Test menu visibility per role

### Action Buttons
- [ ] Wrap Delete buttons with RBACGuard
- [ ] Wrap Edit buttons with RBACGuard
- [ ] Wrap Assign buttons with RBACGuard
- [ ] Wrap Approve buttons with RBACGuard

### Data Tables
- [ ] Add conditional columns
- [ ] Add conditional actions
- [ ] Filter data by prodi
- [ ] Test data visibility

### Forms
- [ ] Replace pembimbing selectors
- [ ] Replace penguji selectors
- [ ] Add capacity indicators
- [ ] Add validation messages

---

## 📊 Phase 5: Data Filtering (Week 5)

### Lists to Filter
- [ ] Mahasiswa list - Apply filterByProdi
- [ ] Tugas akhir list - Apply filterByProdi
- [ ] Bimbingan list - Apply filterByProdi
- [ ] Reports data - Apply filterByProdi
- [ ] Dashboard stats - Apply filterByProdi

### Testing
- [ ] Kajur sees all data
- [ ] Kaprodi D3 sees D3 only
- [ ] Kaprodi D4 sees D4 only
- [ ] Dosen sees assigned only
- [ ] Mahasiswa sees own data only

---

## 🧪 Phase 6: Integration Testing (Week 6)

### Test Scenarios

#### As Kajur
- [ ] Can access all pages
- [ ] Can see all mahasiswa
- [ ] Can assign pembimbing
- [ ] Can assign penguji
- [ ] Can manage users
- [ ] Can access reports
- [ ] Can approve judul

#### As Kaprodi D3
- [ ] Can access kaprodi pages
- [ ] Can see D3 mahasiswa only
- [ ] Cannot see D4 mahasiswa
- [ ] Can assign pembimbing (D3)
- [ ] Can assign penguji (D3)
- [ ] Can access D3 reports
- [ ] Can approve D3 judul

#### As Kaprodi D4
- [ ] Can access kaprodi pages
- [ ] Can see D4 mahasiswa only
- [ ] Cannot see D3 mahasiswa
- [ ] Can assign pembimbing (D4)
- [ ] Can assign penguji (D4)
- [ ] Can access D4 reports
- [ ] Can approve D4 judul

#### As Dosen
- [ ] Can access dosen pages
- [ ] Can see assigned mahasiswa only
- [ ] Cannot see other mahasiswa
- [ ] Can manage bimbingan
- [ ] Can input nilai
- [ ] Cannot assign pembimbing
- [ ] Cannot manage users

#### As Mahasiswa
- [ ] Can access mahasiswa pages
- [ ] Can see own data only
- [ ] Cannot see other mahasiswa
- [ ] Can view bimbingan
- [ ] Can upload documents
- [ ] Cannot access admin pages

### Capacity Testing
- [ ] Assign 4 mahasiswa to dosen - success
- [ ] Try assign 5th mahasiswa - fail
- [ ] Capacity indicator shows correct count
- [ ] Warning shown at 3/4
- [ ] Dosen disabled at 4/4

### Team Composition Testing
- [ ] Assign P1 = P2 - fail
- [ ] Assign P1 ≠ P2 - success
- [ ] Assign 3 same penguji - fail
- [ ] Assign 3 different penguji - success

---

## 📝 Phase 7: Documentation (Week 7)

### Code Documentation
- [ ] Add JSDoc comments to new functions
- [ ] Update component documentation
- [ ] Document new props
- [ ] Update type definitions

### User Documentation
- [ ] Create user guide for Kajur
- [ ] Create user guide for Kaprodi
- [ ] Create user guide for Dosen
- [ ] Create user guide for Mahasiswa

### Developer Documentation
- [ ] Update README
- [ ] Update API docs
- [ ] Update component docs
- [ ] Create troubleshooting guide

---

## 🚀 Phase 8: Deployment (Week 8)

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Backup database
- [ ] Create rollback plan

### Deployment
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify production
- [ ] Monitor errors
- [ ] Check performance

### Post-Deployment
- [ ] Test in production
- [ ] Monitor logs
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Update documentation

---

## 📊 Progress Tracking

### Overall Progress
```
Phase 1: Understanding        [ ] 0% [ ] 25% [ ] 50% [ ] 75% [x] 100%
Phase 2: Backend             [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 3: Frontend Pages      [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 4: UI Components       [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 5: Data Filtering      [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 6: Integration Testing [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 7: Documentation       [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
Phase 8: Deployment          [ ] 0% [ ] 25% [ ] 50% [ ] 75% [ ] 100%
```

### Team Members

#### Backend Developer 1
- [ ] Implement middleware
- [ ] Update routes
- [ ] Write tests
- [ ] Review code

#### Backend Developer 2
- [ ] Update services
- [ ] Add validation
- [ ] Write tests
- [ ] Review code

#### Frontend Developer 1
- [ ] Implement guards
- [ ] Update pages
- [ ] Write tests
- [ ] Review code

#### Frontend Developer 2
- [ ] Update components
- [ ] Add filtering
- [ ] Write tests
- [ ] Review code

#### QA Engineer
- [ ] Create test plan
- [ ] Execute tests
- [ ] Report bugs
- [ ] Verify fixes

#### Tech Lead
- [ ] Review architecture
- [ ] Code review
- [ ] Approve PRs
- [ ] Monitor progress

---

## 🎯 Success Criteria

### Must Have (P0)
- [x] Backend middleware implemented
- [x] Frontend guards implemented
- [ ] All critical routes protected
- [ ] All admin pages guarded
- [ ] Capacity validation working
- [ ] Team composition validation working

### Should Have (P1)
- [ ] All routes protected
- [ ] All pages guarded
- [ ] All UI conditional
- [ ] Data filtering complete
- [ ] Forms replaced
- [ ] Tests passing

### Nice to Have (P2)
- [ ] Performance optimized
- [ ] Analytics added
- [ ] Audit logging
- [ ] Advanced features

---

## 📞 Support & Resources

### Documentation
- **RBAC_README.md** - Quick start
- **RBAC_INDEX.md** - Navigation
- **RBAC_QUICK_REFERENCE.md** - API reference
- **RBAC_MIGRATION_GUIDE.md** - Step-by-step

### Code Examples
- **RBAC_EXAMPLE_IMPLEMENTATION.md** - 6 examples
- **apps/api/src/api/penugasan.router.ts** - Updated example
- **apps/web/components/admin/** - Component examples

### Help
- Check documentation first
- Review examples
- Ask in team chat
- Escalate to tech lead

---

## 🎉 Completion

When all checkboxes are checked:
- [ ] All phases complete
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Team trained
- [ ] Stakeholders informed

**Congratulations! RBAC implementation complete! 🚀**

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-25  
**Status:** Ready for use
