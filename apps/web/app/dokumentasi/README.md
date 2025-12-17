# Dokumentasi - Struktur Modular

File dokumentasi telah dipecah menjadi komponen-komponen kecil untuk maintainability yang lebih baik.

## Struktur Folder

```
dokumentasi/
├── components/          # Komponen reusable
│   └── DocSidebar.tsx  # Sidebar navigasi dokumentasi
├── data/               # Data statis
│   ├── menuItems.ts    # Menu navigasi
│   └── teamData.ts     # Data tim pengembang
├── sections/           # Section konten dokumentasi
│   ├── TeamSection.tsx
│   ├── IntroductionSection.tsx
│   ├── GettingStartedSection.tsx
│   ├── MahasiswaSection.tsx
│   ├── DosenSection.tsx
│   ├── AdminSection.tsx
│   ├── FeaturesSection.tsx
│   ├── TechnologySection.tsx
│   └── FooterSection.tsx
├── DocumentationContent.tsx  # Main component (orchestrator)
└── page.tsx                  # Next.js page wrapper
```

## Keuntungan Struktur Modular

1. **Maintainability**: Setiap section dapat diedit secara independen
2. **Reusability**: Komponen dapat digunakan kembali
3. **Readability**: Kode lebih mudah dibaca dan dipahami
4. **Scalability**: Mudah menambah section baru
5. **Performance**: Lazy loading dapat diterapkan per section

## Cara Menambah Section Baru

1. Buat file baru di `sections/NamaSectionBaru.tsx`
2. Export default function component
3. Import di `DocumentationContent.tsx`
4. Tambahkan component di render
5. Tambahkan menu item di `data/menuItems.ts`

## File Size Comparison

- **Before**: 1 file ~1500 baris
- **After**: 13 files, rata-rata ~100-200 baris per file
