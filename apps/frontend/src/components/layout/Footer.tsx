export default function Footer() {
  return (
    <footer className="flex flex-col justify-between gap-gutter border-t border-outline-variant bg-surface-container px-margin-mobile py-10 md:flex-row md:px-margin-desktop">
      <div>
        <strong className="font-headline-md text-headline-md">Si Ketuk Pintu</strong>
        <p className="mt-2 max-w-sm font-body text-body-md text-on-surface-variant">Official Government Visitor Portal.</p>
      </div>
      <div className="flex flex-wrap gap-6 font-label text-label-sm text-on-surface-variant">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#support">Contact Support</a>
        <a href="#accessibility">Accessibility</a>
      </div>
    </footer>
  );
}
