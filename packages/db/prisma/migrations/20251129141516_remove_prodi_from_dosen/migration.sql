/*
  Warnings:

  - You are about to drop the column `prodi` on the `dosen` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dosen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "nip" TEXT NOT NULL,
    "kuota_bimbingan" INTEGER NOT NULL DEFAULT 4,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dosen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dosen" ("created_at", "id", "kuota_bimbingan", "nip", "updated_at", "user_id") SELECT "created_at", "id", "kuota_bimbingan", "nip", "updated_at", "user_id" FROM "dosen";
DROP TABLE "dosen";
ALTER TABLE "new_dosen" RENAME TO "dosen";
CREATE UNIQUE INDEX "dosen_user_id_key" ON "dosen"("user_id");
CREATE UNIQUE INDEX "dosen_nip_key" ON "dosen"("nip");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
