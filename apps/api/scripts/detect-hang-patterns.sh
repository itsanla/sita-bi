#!/bin/bash

# Hang Pattern Detection Script - Detects all 7 hang patterns

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/media/anla/DATA_B/project/SEMESTER5/matkul-proyek/sita-bi/apps/api"
ISSUES_FOUND=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HANG PATTERN DETECTION SCANNER${NC}"
echo -e "${BLUE}  Based on hang.json documentation${NC}"
echo -e "${BLUE}========================================${NC}\n"

# KASUS 1: Multiple PrismaClient instances
echo -e "${YELLOW}[1/7] Multiple PrismaClient instances...${NC}"
PRISMA_NEW=$(grep -rn "new PrismaClient()" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | grep -v "database.ts" | grep -v "getPrismaClient" | grep -v "prisma-client.ts")
if [ -n "$PRISMA_NEW" ]; then
    echo -e "${RED}❌ CRITICAL: Multiple PrismaClient instances!${NC}"
    echo "$PRISMA_NEW"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Singleton PrismaClient${NC}"
fi
echo ""

# KASUS 2: SQLite references
echo -e "${YELLOW}[2/7] SQLite references...${NC}"
SQLITE_REF=$(grep -rn "sqlite\|SQLite" "$PROJECT_ROOT/src" --include="*.ts" --include="*.prisma" 2>/dev/null)
if [ -n "$SQLITE_REF" ]; then
    echo -e "${RED}❌ WARNING: SQLite references!${NC}"
    echo "$SQLITE_REF"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No SQLite${NC}"
fi
echo ""

# KASUS 3: Database provider
echo -e "${YELLOW}[3/7] Database provider...${NC}"
SCHEMA_PROVIDER=$(grep "datasource" -A 3 "$PROJECT_ROOT/prisma/schema.prisma" 2>/dev/null | grep "provider" | grep -v "postgresql")
if [ -n "$SCHEMA_PROVIDER" ]; then
    echo -e "${RED}❌ CRITICAL: Non-PostgreSQL!${NC}"
    echo "$SCHEMA_PROVIDER"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ PostgreSQL${NC}"
fi
echo ""

# KASUS 4 & 7: business-rules.ts circular dependency
echo -e "${YELLOW}[4/7] business-rules.ts patterns...${NC}"
BUSINESS_REQUIRE=$(grep -n "require.*PengaturanService" "$PROJECT_ROOT/src/utils/business-rules.ts" 2>/dev/null)
BUSINESS_IMPORT=$(grep -n "^import.*PengaturanService" "$PROJECT_ROOT/src/utils/business-rules.ts" 2>/dev/null)
if [ -n "$BUSINESS_REQUIRE" ]; then
    echo -e "${RED}❌ CRITICAL: Using require() - deadlock risk!${NC}"
    echo "$BUSINESS_REQUIRE"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ -z "$BUSINESS_IMPORT" ]; then
    echo -e "${RED}❌ CRITICAL: No PengaturanService import!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Static import${NC}"
fi
echo ""

# KASUS 5: Response stream error handlers
echo -e "${YELLOW}[5/7] Response stream error handlers...${NC}"
APP_TS="$PROJECT_ROOT/src/app.ts"
if [ -f "$APP_TS" ]; then
    HAS_RES_ERROR=$(grep -n "res.once('error'" "$APP_TS" 2>/dev/null)
    HAS_REQ_ERROR=$(grep -n "req.once('error'" "$APP_TS" 2>/dev/null)
    
    if [ -z "$HAS_RES_ERROR" ] || [ -z "$HAS_REQ_ERROR" ]; then
        echo -e "${RED}❌ CRITICAL: Missing error handlers!${NC}"
        [ -z "$HAS_RES_ERROR" ] && echo "  Missing: res.once('error', cleanup)"
        [ -z "$HAS_REQ_ERROR" ] && echo "  Missing: req.once('error', cleanup)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ Error handlers present${NC}"
    fi
else
    echo -e "${RED}❌ app.ts not found!${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# KASUS 6: Middleware service instantiation
echo -e "${YELLOW}[6/7] Middleware service instantiation...${NC}"
MIDDLEWARE_SERVICES=$(grep -rn "^const.*Service.*= new" "$PROJECT_ROOT/src/middlewares" --include="*.ts" 2>/dev/null | grep -v "getInstance\|getService\|get.*Service()")
if [ -n "$MIDDLEWARE_SERVICES" ]; then
    echo -e "${RED}❌ CRITICAL: Direct instantiation in middleware!${NC}"
    echo "$MIDDLEWARE_SERVICES"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Lazy loading in middleware${NC}"
fi
echo ""

# BONUS: Catch blocks without logging
echo -e "${YELLOW}[7/7] Catch blocks without error logging...${NC}"
EMPTY_CATCH=$(grep -rn "catch {" "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | head -5)
if [ -n "$EMPTY_CATCH" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Empty catch blocks (showing first 5):${NC}"
    echo "$EMPTY_CATCH"
else
    echo -e "${GREEN}✅ All catch blocks have error handling${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}   No hang patterns detected.${NC}"
else
    echo -e "${RED}❌ FOUND $ISSUES_FOUND CRITICAL ISSUES!${NC}"
    echo -e "${RED}   Fix these to prevent hangs.${NC}"
fi
echo -e "${BLUE}========================================${NC}"

exit $ISSUES_FOUND
