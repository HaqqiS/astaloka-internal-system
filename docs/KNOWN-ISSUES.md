# 🐛 Sandaran System — Known Issues & Backlog

> **Daftar isu aktif, batasan teknis saat ini, dan antrean fitur mendatang.**

---

## 1. Isu Aktif & Gotchas

- **Header Keamanan HTTP Legacy (`X-XSS-Protection`)**: Header `X-XSS-Protection: 1; mode=block` pada `next.config.js` dipertahankan untuk backward-compatibility browser lawas. Pada standar web modern (OWASP), header ini sudah didepresiasi dan proteksi XSS diemban sepenuhnya oleh `Content-Security-Policy`.
- **Migrasi Bertahap `src/components/reui/`**: Primitif inti (`badge`, `data-grid`, `filters`, `stepper`, `item`, `message`, `bubble`) telah ditempatkan di `src/components/reui/` dengan re-export kompatibilitas di `src/components/ui/`; sisa file caller akan dimigrasikan secara bertahap.

---

## 2. Riwayat Isu yang Telah Terselesaikan (Resolved)

- **[RESOLVED 2026-11-26] RBAC `EXECUTIVE` Read-Only, CRUD Logistik, Mobile Tables, Theme Contrast & Pagination**:
  - Peran `EXECUTIVE` diperketat menjadi *read-only* di backend (`adminProcedure` khusus `ADMIN`, guard upload/mutasi) maupun frontend, sambil tetap mengizinkan komentar feedback laporan (`comment.create`).
  - Memperbaiki izin CRUD master item logistik di `item-actions.tsx` (`LOGISTIC` / `ADMIN`), menambahkan fallback mobile card untuk tabel Dana Darurat dan Dokumen (`< md`), memperbaiki kontras light/dark mode (`/emergency`, `/waiting-approval`, `/unauthorized`), mengaktifkan cursor pagination `"Muat Lebih Banyak"` pada daftar laporan, serta mengarahkan menu homepage (`About`, `Projects`, `Contact`) langsung ke section `/#about`, `/#projects`, dan `/#contact`.

- **[RESOLVED 2026-10-12] Cloudinary Folder Rename — Broken URLs (404)**:
  Telah diselesaikan secara permanen dengan arsitektur **Cosmetic Dynamic Slug** (pola Notion / Stack Overflow) dan **Permanent Storage Key**:
  - **Permanent Storage Key**: Folder Cloudinary menggunakan identifier permanen seumur hidup proyek (`astaloka/[storageKey]/[type]`), di mana `storageKey = [initial-slug]-[shortId]`. Operasi rename folder Cloudinary telah dihapus sepenuhnya sehingga aset historis tidak akan pernah broken/404 saat nama atau slug proyek diedit.
  - **Cosmetic Dynamic Slug**: Slug web berformat `[nama-proyek]-[shortId]` di mana `shortId` diambil dari 10 karakter terakhir ID database CUID (`project.id.slice(-10)`). Jika nama proyek diedit, slug kosmetik diperbarui tanpa menyentuh folder fisik aset.
  - **Zero Broken Links & URL Kanonis**: Prosedur tRPC `getBySlug` mengekstrak `shortId` di akhir URL dengan fallback toleran ke slug lama. Frontend menyinkronkan URL peramban secara transparan via `window.history.replaceState`.
  - **Migrasi Data**: Seluruh proyek eksisting telah dimigrasikan dengan `shortId` dan `storageKey` permanen tanpa merusak link aset yang telah diunggah sebelumnya.
- **[RESOLVED 2026-09-25] Sheet Form Virtual Keyboard Glitch**:
  Glitch tampilan mobile saat keyboard virtual muncul telah diatasi dengan merombak navigasi menjadi Mobile Bottom Navigation (`MobileBottomNav`) dan dialog pemilih proyek menggunakan Vaul Drawer mandiri (`ProjectSwitcherDrawer`).
- **[RESOLVED 2026-10-21] Galeri Foto Dokumentasi Proyek (Project Galleries)**:
  Telah diimplementasikan secara terpadu di `/projects/[slug]/gallery` dengan tampilan Timeline harian, integrasi Dynamic FilterBar (cuaca, tanggal, pelapor), Lightbox interaktif (prev/next, metadata, link laporan, unduh), serta widget preview di Overview Proyek (`GallerySection`) dan tombol pintas di header Laporan.
- **[RESOLVED] Role Lenses Dashboard Remodel**:
  Telah terealisasi pada `/dashboard` untuk `ADMIN`, `EXECUTIVE`, dan `USER` melalui komponen lensa peran (`SupervisorLens`, `ArchitectLens`, `FinanceLens`, `LogisticLens`) beserta router `dashboard` berbasis peran.
- **[RESOLVED 2026-09-30] Lenis Global Scroll Conflict**:
  Konflik smooth scroll Lenis yang mengganggu interaksi form di dalam modal dialog telah diselesaikan dengan membatasi scope `SmoothScrollProvider` hanya pada halaman homepage.

---

## 3. Rencana Fitur & Backlog Mendatang

- **Migrasi Bertahap `src/components/reui/`**: Konsolidasi bertahap sisa caller komponen primitif reUI (`task-list.tsx`, `member-management.tsx`, dll.) ke `src/components/reui/`.
