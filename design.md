# Civic Gateway Design System (`design.md`)

> **Portal Admin — Si Ketuk Pintu (Warm Ivory Palette Redesign)**  
> Panduan standar desain, token warna, tipografi, radius, elevasi, dan pola komponen untuk memastikan konsistensi visual dan pengalaman pengguna di seluruh aplikasi.

---

## 1. Filosofi & Karakter Visual

- **Kesan Utama**: Hangat (*warm*), bersih (*clean*), ramah instansi (*civic/government-ready*), tenang (*calm*), dan presisi.
- **Anti-Slop & Anti-Cliché**: Menghindari palet default AI (purple/neon gradient, generic dark mesh). Menggunakan palet bernuansa *warm cream / ivory*, aksen arang gelap (*dark charcoal* `#18181B`), dan aksen status alami yang harmonis.
- **Hierarki Jelas**: Kartu bertingkat (*nested cards*) dengan *surface* putih `#FFFFFF` di atas background `#F7F6F2`, dipadukan dengan inner fill `#FAF9F5` dan chip `#EFECE4`.

---

## 2. Tipografi (*Typography*)

- **Font Utama**: **Plus Jakarta Sans** (`font-sans`)
- **Fallback**: System sans-serif (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

### Skala Tipografi

| Level / Kegunaan | Ukuran | Weight | Tracking & Leading | Class Tailwind |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** (Header Utama) | 24px - 30px | ExtraBold (800) | `tracking-tight leading-tight` | `text-2xl sm:text-3xl font-extrabold text-civic-dark` |
| **Card / Section Heading** | 16px - 18px | ExtraBold (800) | `tracking-tight leading-snug` | `text-base font-extrabold text-civic-dark` |
| **Subtitle / Description** | 12px - 13px | Medium (500) | `leading-normal` | `text-xs text-civic-muted font-medium` |
| **Body Text / Value** | 12px - 14px | SemiBold (600) | `leading-relaxed` | `text-xs sm:text-sm font-semibold text-civic-dark` |
| **Meta / Label / Helper** | 11px | SemiBold (600) | `leading-tight` | `text-[11px] text-civic-muted font-semibold` |
| **Badge / Chip / Action Pill** | 10px - 11px | ExtraBold (800) | `uppercase tracking-wider` | `text-[10px] sm:text-[11px] font-extrabold` |

---

## 3. Palet Warna & Token Semantik

```
┌─────────────────────────────────────────────────────────────┐
│                    CIVIC WARM PALETTE                       │
├──────────────────┬──────────────────┬───────────────────────┤
│ Background (Bg)  │ Surface (Cards)  │ Sidebar Surface       │
│ #F7F6F2          │ #FFFFFF          │ #F2F0EA               │
├──────────────────┼──────────────────┼───────────────────────┤
│ Inner Card Fill  │ Neutral Chip/Fill│ Border Line           │
│ #FAF9F5          │ #EFECE4          │ #E6E3D8               │
├──────────────────┼──────────────────┼───────────────────────┤
│ Dark Accent (CTA)│ Dark Hover       │ Muted / Subtitle Text │
│ #18181B          │ #27272A          │ #71717A               │
└──────────────────┴──────────────────┴───────────────────────┘
```

### 3.1 Token Warna Inti

| Token CSS | Hex Code | Deskripsi & Penggunaan |
| :--- | :--- | :--- |
| `--color-civic-bg` | `#F7F6F2` | Background utama kanvas halaman (*warm ivory*) |
| `--color-civic-surface` | `#FFFFFF` | Permukaan kartu utama (*pure white*) |
| `--color-civic-sidebar` | `#F2F0EA` | Background panel samping / sidebar (*warm light surface*) |
| `--color-civic-sidebar-border` | `#E5E2D8` | Border pemisah sidebar |
| `--color-civic-card-fill` | `#FAF9F5` | Background kotak data bagian dalam (*inner container soft warm tint*) |
| `--color-civic-neutral-fill` | `#EFECE4` | Background chip, badge nomor, dan pill netral |
| `--color-civic-dark` | `#18181B` | Warna teks judul, tombol utama, dan state aktif (*charcoal dark*) |
| `--color-civic-dark-hover` | `#27272A` | Hover state tombol utama |
| `--color-civic-border` | `#E6E3D8` | Garis pembatas kartu dan tabel (*warm subtle border*) |
| `--color-civic-muted` | `#71717A` | Teks sekunder, label, dan ikon non-aktif |

### 3.2 Token Status (*Harmonized Status Tones*)

| Status | Background Token | Text Token | Indikator / Dot | Contoh Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Pending** | `bg-civic-pendingBg` (`#EFECE4`) | `text-civic-pendingText` (`#524B38`) | `#D97706` (`amber-600`) | Warm beige pill + pulsing amber dot |
| **Disetujui / Approved** | `bg-civic-approvedBg` (`#E6F4EA`) | `text-civic-approvedText` (`#137333`) | `#16A34A` (`emerald-600`) | Soft green pill + emerald dot |
| **Ditolak / Rejected** | `bg-civic-rejectedBg` (`#FCE8E6`) | `text-civic-rejectedText` (`#C5221F`) | `#DC2626` (`rose-600`) | Soft red pill + rose dot |

---

## 4. Radius & Elevasi (*Radius & Elevation*)

### 4.1 Skala Radius
- **Shell & Kartu Utama**: `rounded-3xl` (`24px` s.d. `28px`) — Memberikan siluet modern, ramah, dan premium.
- **Inner Container & Tombol Utama**: `rounded-2xl` (`16px`) — Kotak data detail, field input, tombol submit.
- **Badge / Chip / Dropdown**: `rounded-xl` (`12px`) atau `rounded-full` — Nomor urut tamu, filter chip.
- **Pill Indikator**: `rounded-full` (`9999px`) — Status permohonan, badge notifikasi, tanggal kalender aktif.

### 4.2 Skala Shadow & Border
- **Soft Shadow**: `box-shadow: 0 4px 20px -2px rgba(24, 24, 27, 0.03)` (class: `.soft-shadow`)
- **Border**: `1px solid #E6E3D8` pada semua kartu putih agar kontras dengan background `#F7F6F2`.
- **Scrollbar**: Thumb `#D8D4C8`, track transparan, lebar 6px dengan `border-radius: 99px`.

---

## 5. Pola Komponen (*Component Patterns*)

### 5.1 Sidebar Navigation
```html
<!-- Container Sidebar -->
<aside class="w-64 bg-civic-sidebar border border-civic-sidebarBorder rounded-3xl p-5 soft-shadow flex flex-col justify-between">
  <!-- Brand Logo -->
  <div class="flex items-center gap-3 px-2 pt-1">
    <div class="w-9 h-9 bg-civic-dark rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
      <i data-lucide="building-2" class="w-5 h-5"></i>
    </div>
    <div>
      <h1 class="font-bold text-base tracking-tight leading-none text-civic-dark">Portal Admin</h1>
      <p class="text-[11px] text-civic-muted mt-1 font-medium">Si Ketuk Pintu</p>
    </div>
  </div>

  <!-- Active Navigation Item -->
  <button class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-civic-dark text-white shadow-sm">
    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
    <span>Dashboard</span>
  </button>

  <!-- Inactive Navigation Item -->
  <button class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-civic-muted hover:text-civic-dark hover:bg-civic-neutralFill/60 transition-all">
    <i data-lucide="file-text" class="w-4 h-4"></i>
    <span>Manajemen Permohonan</span>
  </button>
</aside>
```

### 5.2 Header Topbar
```html
<header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pt-1">
  <div>
    <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-civic-dark flex items-center gap-2">
      <span>Selamat Datang, Admin</span>
      <span class="inline-block">👋</span>
    </h2>
    <p class="text-xs text-civic-muted font-medium mt-0.5">Sistem Informasi Manajemen Permohonan Kunjungan Instansi</p>
  </div>
  <div class="flex items-center gap-2.5">
    <!-- Search Bar -->
    <div class="relative flex-1 sm:w-64">
      <input type="text" placeholder="Cari permohonan..." class="w-full bg-civic-surface text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-civic-border focus:outline-none focus:border-civic-dark soft-shadow text-civic-dark" />
    </div>
    <!-- Scanner Button -->
    <button class="flex items-center gap-2 bg-civic-surface border border-civic-border hover:border-civic-dark text-civic-dark text-xs font-bold px-3.5 py-2.5 rounded-2xl soft-shadow transition-all">
      <i data-lucide="scan-line" class="w-4 h-4"></i>
      <span class="hidden md:inline">Scanner</span>
    </button>
  </div>
</header>
```

### 5.3 Kartu Ringkasan Statistik (*Stat Cards*)
```html
<div class="bg-civic-surface p-4 rounded-3xl border border-civic-border soft-shadow space-y-3">
  <div class="flex items-center justify-between">
    <div class="w-9 h-9 rounded-xl bg-civic-pendingBg text-civic-pendingText flex items-center justify-center">
      <i data-lucide="clock" class="w-4 h-4"></i>
    </div>
    <span class="text-xs font-bold text-civic-pendingText bg-civic-pendingBg px-2.5 py-0.5 rounded-full border border-civic-border">5 Pending</span>
  </div>
  <div>
    <h4 class="font-extrabold text-xs text-civic-dark">Kunjungan Kerja Kominfo</h4>
    <p class="text-[11px] text-civic-muted mt-0.5">Kabupaten Tapin</p>
  </div>
  <div class="pt-2 border-t border-civic-border flex items-center justify-between text-[11px]">
    <span class="text-civic-muted">SKP-20260819-KYK4D</span>
    <span class="font-extrabold text-civic-dark">Pending</span>
  </div>
</div>
```

### 5.4 Tombol Aksi (*Buttons*)
- **Primary Action (Setujui / Submit / Konfirmasi)**:
  `bg-civic-dark hover:bg-civic-darkHover text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2`
- **Secondary Action (Unduh / Detail / Batal)**:
  `bg-civic-surface hover:bg-civic-cardFill border border-civic-border text-civic-dark font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2`
- **Destructive Action (Tolak / Hapus)**:
  `bg-civic-surface hover:bg-civic-rejectedBg border border-civic-border hover:border-rose-300 text-civic-rejectedText font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2`

### 5.5 Mini Calendar Widget
- Kotak kalender mini dengan header bulan/tahun, nama hari singkat (`S M T W T F S`), dan penanda tanggal kunjungan aktif berbentuk lingkaran arang pekat (`w-6 h-6 rounded-full bg-civic-dark text-white font-extrabold flex items-center justify-center text-xs shadow-sm`).

---

## 6. Konfigurasi Tailwind CSS v4 (`index.css`)

```css
@import 'tailwindcss';

@theme {
  --color-civic-bg: #F7F6F2;
  --color-civic-surface: #FFFFFF;
  --color-civic-sidebar: #F2F0EA;
  --color-civic-sidebar-border: #E5E2D8;
  --color-civic-card-fill: #FAF9F5;
  --color-civic-neutral-fill: #EFECE4;
  --color-civic-dark: #18181B;
  --color-civic-dark-hover: #27272A;
  --color-civic-border: #E6E3D8;
  --color-civic-muted: #71717A;

  --color-civic-pending-bg: #EFECE4;
  --color-civic-pending-text: #524B38;
  --color-civic-approved-bg: #E6F4EA;
  --color-civic-approved-text: #137333;
  --color-civic-rejected-bg: #FCE8E6;
  --color-civic-rejected-text: #C5221F;

  --font-sans: 'Plus Jakarta Sans', sans-serif;
}

@layer utilities {
  .soft-shadow {
    box-shadow: 0 4px 20px -2px rgba(24, 24, 27, 0.03);
  }
}
```

---

## 7. Checklist Konsistensi Desain (*Pre-Flight Check*)

1. [ ] **Background & Surface**: Seluruh halaman admin menggunakan background `bg-civic-bg` (`#F7F6F2`) dan kartu utama `bg-civic-surface` (`#FFFFFF`).
2. [ ] **Border Consistency**: Semua border luar menggunakan `border-civic-border` (`#E6E3D8`) dengan radius `rounded-3xl` pada kartu utama dan `rounded-2xl` pada inner card.
3. [ ] **Button Contrast**: Tombol utama menggunakan `bg-civic-dark` (`#18181B`) dengan teks putih pekat `text-white`.
4. [ ] **Status Badges**: Semua status permohonan menggunakan kombinasi warna harmonis (pending: beige/amber, approved: soft-green/emerald, rejected: soft-red/rose).
5. [ ] **Scrollbars**: Scrollbar disesuaikan dengan thumb `#D8D4C8` dan lebar 6px.
6. [ ] **Responsiveness**: Memastikan sidebar dapat beralih ke mobile drawer yang mulus pada layar `< 1024px` tanpa layout overflow.
