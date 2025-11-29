-- CreateTable
CREATE TABLE "pengajuan_pelepasan_bimbingan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "peran_dosen_ta_id" INTEGER NOT NULL,
    "diajukan_oleh_user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU_KONFIRMASI',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengajuan_pelepasan_bimbingan_peran_dosen_ta_id_fkey" FOREIGN KEY ("peran_dosen_ta_id") REFERENCES "peran_dosen_ta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengajuan_pelepasan_bimbingan_diajukan_oleh_user_id_fkey" FOREIGN KEY ("diajukan_oleh_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
