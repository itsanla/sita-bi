# Quick Fix Guide - Remaining TypeScript Errors

## 🚨 Current Status

**Build Status**: ❌ FAILED (TypeScript errors remaining)
**Progress**: ~90% Complete
**Remaining Issues**: ~5-10 TypeScript errors related to API response types

## 🔧 Remaining TypeScript Errors to Fix

### Pattern: API Response Type Mismatch

**Problem**: API responses have nested `data` structure but setState expects flat array

**Example Error**:
```
Type error: Argument of type '{ data: Schedule[]; }' is not assignable to parameter of type 'SetStateAction<Schedule[]>'.
```

**Solution Pattern**:
```typescript
// ❌ BAD
const response = await request<{ data: Schedule[] }>('/endpoint');
setSchedules(response.data || []);

// ✅ GOOD - Option 1: Access nested data
const response = await request<{ data: { data: Schedule[] } }>('/endpoint');
setSchedules(response.data.data || []);

// ✅ GOOD - Option 2: Destructure properly
const response = await request<{ data: Schedule[] }>('/endpoint');
if (Array.isArray(response.data)) {
  setSchedules(response.data);
}
```

### Files Needing This Fix:

1. **`app/dashboard/admin/jadwal-sidang/page.tsx`** (line 90-92)
   ```typescript
   // Current (WRONG):
   setSchedules(schedulesRes.data || []);
   setUnscheduled(unscheduledRes.data || []);
   setRooms(roomsRes.data || []);
   
   // Fix to:
   setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
   setUnscheduled(Array.isArray(unscheduledRes.data) ? unscheduledRes.data : []);
   setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
   ```

2. **`app/components/ActivityLog.tsx`** (line 25)
   - Already attempted fix, may need adjustment
   - Check API response structure from backend

3. **Similar pattern in other dashboard pages**
   - Search for: `setXxx(response.data || [])`
   - Replace with proper type checking

## 🎯 Step-by-Step Fix Instructions

### Step 1: Fix jadwal-sidang/page.tsx

```bash
# Open file
code apps/web/app/dashboard/admin/jadwal-sidang/page.tsx

# Find lines 90-92 and replace with:
```

```typescript
// Around line 90-92
if (Array.isArray(schedulesRes.data)) {
  setSchedules(schedulesRes.data);
}
if (Array.isArray(unscheduledRes.data)) {
  setUnscheduled(unscheduledRes.data);
}
if (Array.isArray(roomsRes.data)) {
  setRooms(roomsRes.data);
}
```

### Step 2: Find All Similar Patterns

```bash
cd apps/web
# Find all files with this pattern
grep -rn "set.*\.data \|\| \[\]" app/ --include="*.tsx" --include="*.ts"
```

### Step 3: Apply Same Fix Pattern

For each occurrence, replace:
```typescript
// From:
setState(response.data || []);

// To:
if (Array.isArray(response.data)) {
  setState(response.data);
} else if (response.data?.data && Array.isArray(response.data.data)) {
  setState(response.data.data);
}
```

### Step 4: Test Build

```bash
pnpm --filter web build
```

## 🔍 Debugging Tips

### Check API Response Structure

Add temporary logging to see actual response structure:

```typescript
const response = await request('/endpoint');
console.log('Response structure:', JSON.stringify(response, null, 2));
```

### Common Response Patterns

**Pattern 1**: Flat data array
```json
{
  "data": [...]
}
```

**Pattern 2**: Nested data
```json
{
  "data": {
    "data": [...]
  }
}
```

**Pattern 3**: With metadata
```json
{
  "status": "success",
  "data": [...],
  "message": "OK"
}
```

## 📝 Complete Fix Script

Create a file `fix-api-responses.sh`:

```bash
#!/bin/bash

# Fix all API response type issues

cd apps/web

# Pattern 1: Simple array setState
find app -name "*.tsx" -type f -exec sed -i 's/setState(\([^)]*\)\.data || \[\])/if (Array.isArray(\1.data)) { setState(\1.data); }/g' {} \;

# Run build to check
pnpm build
```

## ✅ Verification Checklist

After fixes:

- [ ] `pnpm --filter web build` - No TypeScript errors
- [ ] `pnpm --filter web lint` - Check warnings (non-blocking)
- [ ] Test dev server: `pnpm --filter web dev`
- [ ] Check browser console for runtime errors
- [ ] Test API calls in browser

## 🎉 Expected Final State

After all fixes:
```
✓ pnpm --filter web build - SUCCESS
⚠️ ~60-70 ESLint warnings (non-blocking, cosmetic)
✓ 0 TypeScript errors
✓ 0 Build errors
```

## 📚 Additional Resources

- **API Layer**: `apps/web/lib/api.ts` - Enhanced with full error handling
- **Type Definitions**: `apps/web/types/index.ts` - User and ApiResponse types
- **Summary**: `FRONTEND_FIXES_SUMMARY.md` - Complete list of fixes applied

## 🚀 Quick Commands

```bash
# Build
pnpm --filter web build

# Lint
pnpm --filter web lint

# Dev server
pnpm --filter web dev

# Format
pnpm format

# Check specific file
pnpm --filter web build 2>&1 | grep "filename.tsx"
```

---

**Note**: Focus on fixing TypeScript errors first (blocking), then tackle ESLint warnings (non-blocking) later.

**Estimated Time**: 15-30 minutes to fix remaining TypeScript errors
