-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email_verified_at" DATETIME,
    "password" TEXT NOT NULL,
    "photo" TEXT,
    "remember_token" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lockout_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "guard_name" TEXT NOT NULL DEFAULT 'api',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "guard_name" TEXT NOT NULL DEFAULT 'api',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "nim" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mahasiswa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dosen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "nidn" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dosen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tawaran_topik" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "judul_topik" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kuota" INTEGER NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tawaran_topik_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "history_topik_mahasiswa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mahasiswa_id" INTEGER NOT NULL,
    "tawaran_topik_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "history_topik_mahasiswa_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "history_topik_mahasiswa_tawaran_topik_id_fkey" FOREIGN KEY ("tawaran_topik_id") REFERENCES "tawaran_topik" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tugas_akhir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mahasiswa_id" INTEGER NOT NULL,
    "tawaran_topik_id" INTEGER,
    "judul" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tanggal_pengajuan" DATETIME,
    "disetujui_oleh" INTEGER,
    "ditolak_oleh" INTEGER,
    "alasan_penolakan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tugas_akhir_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tugas_akhir_tawaran_topik_id_fkey" FOREIGN KEY ("tawaran_topik_id") REFERENCES "tawaran_topik" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tugas_akhir_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tugas_akhir_ditolak_oleh_fkey" FOREIGN KEY ("ditolak_oleh") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "peran_dosen_ta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "peran" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "peran_dosen_ta_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "peran_dosen_ta_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bimbingan_ta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "peran" TEXT NOT NULL,
    "sesi_ke" INTEGER,
    "tanggal_bimbingan" DATETIME,
    "jam_bimbingan" TEXT,
    "status_bimbingan" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bimbingan_ta_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bimbingan_ta_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "catatan_bimbingan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bimbingan_ta_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "catatan" TEXT NOT NULL,
    "author_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "catatan_bimbingan_bimbingan_ta_id_fkey" FOREIGN KEY ("bimbingan_ta_id") REFERENCES "bimbingan_ta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "catatan_bimbingan_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "history_perubahan_jadwal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bimbingan_ta_id" INTEGER NOT NULL,
    "mahasiswa_id" INTEGER NOT NULL,
    "tanggal_lama" DATETIME,
    "jam_lama" TEXT,
    "tanggal_baru" DATETIME,
    "jam_baru" TEXT,
    "alasan_perubahan" TEXT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "history_perubahan_jadwal_bimbingan_ta_id_fkey" FOREIGN KEY ("bimbingan_ta_id") REFERENCES "bimbingan_ta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "history_perubahan_jadwal_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengajuan_bimbingan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mahasiswa_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "diinisiasi_oleh" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN_DOSEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengajuan_bimbingan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengajuan_bimbingan_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pendaftaran_sidang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "status_verifikasi" TEXT NOT NULL DEFAULT 'menunggu_verifikasi',
    "status_pembimbing_1" TEXT NOT NULL DEFAULT 'menunggu',
    "status_pembimbing_2" TEXT NOT NULL DEFAULT 'menunggu',
    "catatan_admin" TEXT,
    "catatan_pembimbing_1" TEXT,
    "catatan_pembimbing_2" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pendaftaran_sidang_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pendaftaran_sidang_files" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pendaftaran_sidang_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "tipe_dokumen" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pendaftaran_sidang_files_pendaftaran_sidang_id_fkey" FOREIGN KEY ("pendaftaran_sidang_id") REFERENCES "pendaftaran_sidang" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sidang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "pendaftaran_sidang_id" INTEGER,
    "jenis_sidang" TEXT NOT NULL,
    "status_hasil" TEXT NOT NULL DEFAULT 'menunggu_penjadwalan',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sidang_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sidang_pendaftaran_sidang_id_fkey" FOREIGN KEY ("pendaftaran_sidang_id") REFERENCES "pendaftaran_sidang" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "history_perubahan_sidang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sidang_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "perubahan" TEXT NOT NULL,
    "alasan_perubahan" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "history_perubahan_sidang_sidang_id_fkey" FOREIGN KEY ("sidang_id") REFERENCES "sidang" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "history_perubahan_sidang_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jadwal_sidang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sidang_id" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "waktu_mulai" TEXT NOT NULL,
    "waktu_selesai" TEXT NOT NULL,
    "ruangan_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jadwal_sidang_sidang_id_fkey" FOREIGN KEY ("sidang_id") REFERENCES "sidang" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "jadwal_sidang_ruangan_id_fkey" FOREIGN KEY ("ruangan_id") REFERENCES "ruangan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ruangan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_ruangan" TEXT NOT NULL,
    "lokasi" TEXT,
    "kapasitas" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "nilai_sidang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sidang_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "aspek" TEXT NOT NULL,
    "komentar" TEXT,
    "skor" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "nilai_sidang_sidang_id_fkey" FOREIGN KEY ("sidang_id") REFERENCES "sidang" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nilai_sidang_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dokumen_ta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "tipe_dokumen" TEXT NOT NULL,
    "status_validasi" TEXT NOT NULL DEFAULT 'menunggu',
    "divalidasi_oleh_p1" INTEGER,
    "divalidasi_oleh_p2" INTEGER,
    "file_path" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dokumen_ta_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dokumen_ta_divalidasi_oleh_p1_fkey" FOREIGN KEY ("divalidasi_oleh_p1") REFERENCES "dosen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dokumen_ta_divalidasi_oleh_p2_fkey" FOREIGN KEY ("divalidasi_oleh_p2") REFERENCES "dosen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "dibuat_oleh" INTEGER NOT NULL,
    "audiens" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" DATETIME,
    "prioritas" TEXT NOT NULL DEFAULT 'MENENGAH',
    "kategori" TEXT,
    "berakhir_pada" DATETIME,
    "tanggal_dibuat" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pengumuman_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengumuman_lampiran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pengumuman_id" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT,
    "file_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pengumuman_lampiran_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengumuman_pembaca" (
    "pengumuman_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("pengumuman_id", "user_id"),
    CONSTRAINT "pengumuman_pembaca_pengumuman_id_fkey" FOREIGN KEY ("pengumuman_id") REFERENCES "pengumuman" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pengumuman_pembaca_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "url" TEXT,
    "method" TEXT,
    "details" TEXT,
    "module" TEXT,
    "entity_id" INTEGER,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verification_tokens_email_fkey" FOREIGN KEY ("email") REFERENCES "users" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notifikasi_ta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "tugas_akhir_id" INTEGER NOT NULL,
    "pesan" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notifikasi_ta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifikasi_ta_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "history_penugasan_dosen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tugas_akhir_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "dosen_id" INTEGER NOT NULL,
    "peran" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "history_penugasan_dosen_tugas_akhir_id_fkey" FOREIGN KEY ("tugas_akhir_id") REFERENCES "tugas_akhir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "history_penugasan_dosen_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "history_penugasan_dosen_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_user_id_key" ON "mahasiswa"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_user_id_key" ON "dosen"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nidn_key" ON "dosen"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "tugas_akhir_mahasiswa_id_key" ON "tugas_akhir"("mahasiswa_id");

-- CreateIndex
CREATE UNIQUE INDEX "peran_dosen_ta_tugas_akhir_id_peran_key" ON "peran_dosen_ta"("tugas_akhir_id", "peran");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_bimbingan_mahasiswa_id_dosen_id_key" ON "pengajuan_bimbingan"("mahasiswa_id", "dosen_id");

-- CreateIndex
CREATE UNIQUE INDEX "sidang_pendaftaran_sidang_id_key" ON "sidang"("pendaftaran_sidang_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_email_key" ON "email_verification_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");
