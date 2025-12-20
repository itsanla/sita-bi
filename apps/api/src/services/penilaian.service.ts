import type { Prisma } from '../prisma-client';
import { PrismaClient, StatusTugasAkhir, HasilSidang } from '../prisma-client';
import type { CreatePenilaianDto } from '../dto/penilaian.dto';

export class PenilaianService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createNilai(
    dto: CreatePenilaianDto,
    dosenId: number,
  ): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      const sidang = await tx.sidang.findUnique({
        where: { id: dto.sidang_id },
        include: {
          tugasAkhir: { include: { peranDosenTa: true } },
          _count: { select: { nilaiSidang: true } },
        },
      });

      if (sidang === null) {
        throw new Error('Sidang not found.');
      }

      const peranDosen = sidang.tugasAkhir.peranDosenTa;
      const isAllowed = peranDosen.some(
        (p) =>
          p.dosen_id === dosenId &&
          (p.peran.startsWith('pembimbing') || p.peran.startsWith('penguji')),
      );

      if (!isAllowed) {
        throw new Error(
          'You are not authorized to submit a score for this defense.',
        );
      }

      const newNilai = await tx.nilaiSidang.create({
        data: {
          sidang_id: dto.sidang_id,
          dosen_id: dosenId,
          aspek: dto.aspek,
          skor: dto.skor,
          komentar: dto.komentar,
        },
      });

      // --- Finalize Logic ---
      const jumlahPenilai = peranDosen.filter(
        (p) =>
          p.peran.startsWith('pembimbing') || p.peran.startsWith('penguji'),
      ).length;
      const currentCount = sidang._count.nilaiSidang ?? 0;
      const jumlahNilaiMasuk = Number(currentCount) + 1;

      if (jumlahNilaiMasuk >= jumlahPenilai) {
        await this._calculateAndFinalizeHasilSidang(sidang.id, tx);
      }

      return newNilai;
    });
  }

  private async _calculateAndFinalizeHasilSidang(
    sidangId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const semuaNilai = await tx.nilaiSidang.findMany({
      where: { sidang_id: sidangId },
    });

    if (semuaNilai.length === 0) return;

    const totalSkor = semuaNilai.reduce((acc, nilai) => {
      const skorNumber = Number(nilai.skor);
      return Number(acc) + skorNumber;
    }, 0);
    const rataRata = totalSkor / semuaNilai.length;

    let hasilSidang: HasilSidang;
    let statusTa: StatusTugasAkhir;

    // Example logic for determining outcome
    if (rataRata >= 80) {
      hasilSidang = HasilSidang.lulus;
      statusTa = StatusTugasAkhir.LULUS_TANPA_REVISI;
    } else if (rataRata >= 60) {
      hasilSidang = HasilSidang.lulus_revisi;
      statusTa = StatusTugasAkhir.LULUS_DENGAN_REVISI;
    } else {
      hasilSidang = HasilSidang.tidak_lulus;
      statusTa = StatusTugasAkhir.GAGAL;
    }

    const sidang = await tx.sidang.update({
      where: { id: sidangId },
      data: { status_hasil: hasilSidang },
      select: { tugas_akhir_id: true },
    });

    await tx.tugasAkhir.update({
      where: { id: sidang.tugas_akhir_id },
      data: { status: statusTa },
    });
  }

  async getNilaiForSidang(sidangId: number): Promise<unknown> {
    return this.prisma.nilaiSidang.findMany({
      where: { sidang_id: sidangId },
      include: { dosen: { include: { user: true } } },
    });
  }
}
