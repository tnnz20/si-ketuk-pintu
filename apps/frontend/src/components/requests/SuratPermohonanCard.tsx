import { Download } from 'lucide-react';

interface SuratPermohonanCardProps {
  generating: boolean;
  onGeneratePdf: () => void;
}

export default function SuratPermohonanCard({
  generating,
  onGeneratePdf,
}: SuratPermohonanCardProps) {
  return (
    <section className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-6">
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="text-sm font-extrabold text-civic-dark">Surat Permohonan</h3>
      </div>

      <div className="space-y-2">
        <div className="bg-civic-cardFill flex items-center justify-between rounded-2xl border border-civic-border p-3">
          <div className="mr-2 min-w-0 truncate">
            <p className="text-2xs font-extrabold tracking-wider text-civic-muted uppercase">
              Surat Permohonan
            </p>
            <p className="truncate text-xs font-bold text-civic-dark">Unduh Surat Permohonan</p>
          </div>
          <button
            type="button"
            onClick={onGeneratePdf}
            disabled={generating}
            aria-label="Unduh Surat Permohonan"
            title="Unduh Berkas"
            className="shrink-0 cursor-pointer rounded-xl p-1.5 text-civic-muted transition-colors hover:bg-white hover:text-civic-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
