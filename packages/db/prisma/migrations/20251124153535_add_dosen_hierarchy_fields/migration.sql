-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dosen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "nidn" TEXT NOT NULL,
    "prodi" TEXT,
    "kuota_bimbingan" INTEGER NOT NULL DEFAULT 4,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dosen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dosen" ("created_at", "id", "nidn", "updated_at", "user_id") SELECT "created_at", "id", "nidn", "updated_at", "user_id" FROM "dosen";
DROP TABLE "dosen";
ALTER TABLE "new_dosen" RENAME TO "dosen";
CREATE UNIQUE INDEX "dosen_user_id_key" ON "dosen"("user_id");
CREATE UNIQUE INDEX "dosen_nidn_key" ON "dosen"("nidn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
