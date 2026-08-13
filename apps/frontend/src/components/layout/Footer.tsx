export default function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mx-auto flex max-w-container-max flex-col justify-between gap-8 md:flex-row md:items-start">
        <div>
          <strong className="font-headline-md text-headline-md">Si Ketuk Pintu</strong>
          <p className="mt-2 max-w-sm font-body text-body-md text-on-surface-variant">
            Portal resmi permohonan kunjungan tamu instansi pemerintah. Transparan, aman, dan efisien.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 font-label text-label-sm text-on-surface-variant">
          <a href="#privacy" className="transition-colors hover:text-emerald-600">Kebijakan Privasi</a>
          <a href="#terms" className="transition-colors hover:text-emerald-600">Syarat & Ketentuan</a>
          <a href="#support" className="transition-colors hover:text-emerald-600">Hubungi Kami</a>
          <a href="#accessibility" className="transition-colors hover:text-emerald-600">Aksesibilitas</a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-container-max border-t border-surface-alt pt-6">
        <p className="text-center font-label text-label-sm text-on-surface-variant">
          &copy; 2026 Si Ketuk Pintu. Hak cipta dilindungi undang-undang.
        </p>
      </div>
    </footer>
  );
}
