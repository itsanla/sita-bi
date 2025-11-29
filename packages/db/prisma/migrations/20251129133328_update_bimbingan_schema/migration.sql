/*
  Warnings:

  - You are about to drop the column `nidn` on the `dosen` table. All the data in the column will be lost.
  - Made the column `sesi_ke` on table `bimbingan_ta` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `nip` to the `dosen` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "bimbingan_lampiran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bimbingan_ta_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT,
    "file_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bimbingan_lampiran_bimbingan_ta_id_fkey" FOREIGN KEY ("bimbingan_ta_id") REFERENCES "bimbingan_ta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bimbingan_ta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "peran" TEXT NOT NULL,
    "sesi_ke" INTEGER NOT NULL,
    "tanggal_bimbingan" DATETIME,
    "jam_bimbingan" TEXT,
    "jam_selesai" TEXT,
    "status_bimbingan" TEXT NOT NULL DEFAULT 'dijadwalkan',
    "is_konfirmasi" BOOLEAN NOT NULL DEFAULT false,
    "konfirmasi_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bimbingan_ta_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bimbingan_ta_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bimbingan_ta" ("created_at", "dosen_id", "id", "jam_bimbingan", "peran", "sesi_ke", "status_bimbingan", "tanggal_bimbingan", "tugas_akhir_id", "updated_at") SELECT "created_at", "dosen_id", "id", "jam_bimbingan", "peran", "sesi_ke", "status_bimbingan", "tanggal_bimbingan", "tugas_akhir_id", "updated_at" FROM "bimbingan_ta";
DROP TABLE "bimbingan_ta";
ALTER TABLE "new_bimbingan_ta" RENAME TO "bimbingan_ta";
CREATE TABLE "new_dosen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "nip" TEXT NOT NULL,
    "prodi" TEXT,
    "kuota_bimbingan" INTEGER NOT NULL DEFAULT 4,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dosen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dosen" ("created_at", "id", "kuota_bimbingan", "prodi", "updated_at", "user_id") SELECT "created_at", "id", "kuota_bimbingan", "prodi", "updated_at", "user_id" FROM "dosen";
DROP TABLE "dosen";
ALTER TABLE "new_dosen" RENAME TO "dosen";
CREATE UNIQUE INDEX "dosen_user_id_key" ON "dosen"("user_id");
CREATE UNIQUE INDEX "dosen_nip_key" ON "dosen"("nip");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
