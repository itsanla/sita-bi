#!/bin/bash

# Hang Pattern Detection Script
# Detects all 6 hang patterns documented in hang.json

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/media/anla/DATA_B/project/SEMESTER5/matkul-proyek/sita-bi/apps/api"
ISSUES_FOUND=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HANG PATTERN DETECTION SCANNER${NC}"
echo -e "${BLUE}========================================${NC}\n"

# KASUS 1: Multiple PrismaClient instances
echo -e "${YELLOW}[1/6] Checking for multiple PrismaClient instances...${NC}"
PRISMA_NEW=$(grep -rn "new PrismaClient()" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "database.ts" | grep -v "getPrismaClient" | grep -v "prisma-client.ts")
if [ -n "$PRISMA_NEW" ]; then
    echo -e "${RED}❌ CRITICAL: Multiple PrismaClient instances detected!${NC}"
    echo "$PRISMA_NEW"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No multiple PrismaClient instances${NC}"
fi
echo ""

# KASUS 2: SQLite references
echo -e "${YELLOW}[2/6] Checking for SQLite references...${NC}"
SQLITE_REF=$(grep -rn "sqlite\|SQLite" "$PROJECT_ROOT/src" --include="*.ts" --include="*.prisma" 2>/dev/null)
if [ -n "$SQLITE_REF" ]; then
    echo -e "${RED}❌ WARNING: SQLite references found!${NC}"
    echo "$SQLITE_REF"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No SQLite references${NC}"
fi
echo ""

# KASUS 3: Database provider check
echo -e "${YELLOW}[3/6] Checking database provider in schema.prisma...${NC}"
SCHEMA_PROVIDER=$(grep "datasource" -A 3 "$PROJECT_ROOT/prisma/schema.prisma" 2>/dev/null | grep "provider" | grep -v "postgresql")
if [ -n "$SCHEMA_PROVIDER" ]; then
    echo -e "${RED}❌ CRITICAL: Non-PostgreSQL datasource provider detected!${NC}"
    echo "$SCHEMA_PROVIDER"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Using PostgreSQL provider${NC}"
fi
echo ""

# KASUS 4: Module-level service instantiation
echo -e "${YELLOW}[4/6] Checking for module-level service instantiation...${NC}"
MODULE_LEVEL=$(grep -rn "^const.*Service.*= new.*Service()" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "getPrismaClient\|getInstance\|getService")
if [ -n "$MODULE_LEVEL" ]; then
    echo -e "${RED}❌ CRITICAL: Module-level service instantiation detected!${NC}"
    echo "$MODULE_LEVEL"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No module-level service instantiation${NC}"
fi
echo ""

# KASUS 5: Response stream error handlers
echo -e "${YELLOW}[5/6] Checking for response stream error handlers...${NC}"
APP_TS="$PROJECT_ROOT/src/app.ts"
if [ -f "$APP_TS" ]; then
    HAS_RES_ERROR=$(grep -n "res.once('error'" "$APP_TS" 2>/dev/null)
    HAS_REQ_ERROR=$(grep -n "req.once('error'" "$APP_TS" 2>/dev/null)
    
    if [ -z "$HAS_RES_ERROR" ] || [ -z "$HAS_REQ_ERROR" ]; then
        echo -e "${RED}❌ CRITICAL: Missing error handlers in app.ts!${NC}"
        [ -z "$HAS_RES_ERROR" ] && echo "  - Missing: res.once('error', cleanup)"
        [ -z "$HAS_REQ_ERROR" ] && echo "  - Missing: req.once('error', cleanup)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ Response stream error handlers present${NC}"
    fi
else
    echo -e "${RED}❌ ERROR: app.ts not found!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# KASUS 6: Middleware service instantiation
echo -e "${YELLOW}[6/6] Checking middleware for service instantiation...${NC}"
MIDDLEWARE_SERVICES=$(grep -rn "^const.*Service.*= new" "$PROJECT_ROOT/src/middlewares" --include="*.ts" 2>/dev/null | grep -v "getInstance\|getService")
if [ -n "$MIDDLEWARE_SERVICES" ]; then
    echo -e "${RED}❌ CRITICAL: Service instantiation in middleware detected!${NC}"
    echo "$MIDDLEWARE_SERVICES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No service instantiation in middleware${NC}"
fi
echo ""

# BONUS: Check for missing await
echo -e "${YELLOW}[BONUS] Checking for missing await on async calls...${NC}"
MISSING_AWAIT=$(grep -rn "prisma\.\w\+\.\(findMany\|findFirst\|findUnique\|create\|update\|delete\)" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "await" | head -10)
if [ -n "$MISSING_AWAIT" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential missing await detected (showing first 10):${NC}"
    echo "$MISSING_AWAIT"
else
    echo -e "${GREEN}✅ No obvious missing await${NC}"
fi
echo ""

# BONUS: Check for transaction without timeout
echo -e "${YELLOW}[BONUS] Checking for transactions without timeout...${NC}"
TRANSACTION_NO_TIMEOUT=$(grep -rn "prisma.\$transaction" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "timeout" | head -5)
if [ -n "$TRANSACTION_NO_TIMEOUT" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Transactions without timeout (showing first 5):${NC}"
    echo "$TRANSACTION_NO_TIMEOUT"
else
    echo -e "${GREEN}✅ All transactions have timeout or none found${NC}"
fi
echo ""

# BONUS: Check for circular dependencies
echo -e "${YELLOW}[BONUS] Checking for potential circular dependencies...${NC}"
CIRCULAR=$(grep -rn "require.*\.\./" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | head -5)
if [ -n "$CIRCULAR" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential circular dependencies (showing first 5):${NC}"
    echo "$CIRCULAR"
else
    echo -e "${GREEN}✅ No obvious circular dependencies${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED! No hang patterns detected.${NC}"
else
    echo -e "${RED}❌ FOUND $ISSUES_FOUND CRITICAL ISSUES!${NC}"
    echo -e "${RED}   Please fix these issues to prevent hangs.${NC}"
fi
echo -e "${BLUE}========================================${NC}"

exit $ISSUES_FOUND
