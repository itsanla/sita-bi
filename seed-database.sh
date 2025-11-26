#!/bin/bash

echo "🌱 SITA-BI Database Seeder"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "⚠️  WARNING: This will DELETE all existing data!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Seeding cancelled"
    exit 0
fi

echo ""
echo "🗑️  Resetting database..."
pnpm --filter @repo/db db:push --force-reset

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed"
    exit 1
fi

echo ""
echo "🌱 Running seeder..."
pnpm --filter @repo/db db:seed

if [ $? -ne 0 ]; then
    echo "❌ Seeding failed"
    exit 1
fi

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "🔑 Login Credentials (password: password123):"
echo "   Admin:       admin@pnp.ac.id"
echo "   Kajur:       kajur@pnp.ac.id"
echo "   Kaprodi D3:  kaprodi.d3@pnp.ac.id"
echo "   Kaprodi D4:  kaprodi.d4@pnp.ac.id"
echo "   Dosen:       rina.wati@pnp.ac.id"
echo "   Mahasiswa:   2101010001@student.pnp.ac.id"
echo ""
echo "📖 For more details, see: packages/db/SEEDER_README.md"
