/*
  Warnings:

  - Added the required column `peran_yang_diajukan` to the `pengajuan_bimbingan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pengajuan_bimbingan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mahasiswa_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "diinisiasi_oleh" TEXT NOT NULL,
    "peran_yang_diajukan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN_DOSEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengajuan_bimbingan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengajuan_bimbingan_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pengajuan_bimbingan" ("created_at", "diinisiasi_oleh", "dosen_id", "id", "mahasiswa_id", "status", "updated_at") SELECT "created_at", "diinisiasi_oleh", "dosen_id", "id", "mahasiswa_id", "status", "updated_at" FROM "pengajuan_bimbingan";
DROP TABLE "pengajuan_bimbingan";
ALTER TABLE "new_pengajuan_bimbingan" RENAME TO "pengajuan_bimbingan";
CREATE UNIQUE INDEX "pengajuan_bimbingan_mahasiswa_id_dosen_id_peran_yang_diajukan_key" ON "pengajuan_bimbingan"("mahasiswa_id", "dosen_id", "peran_yang_diajukan");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
