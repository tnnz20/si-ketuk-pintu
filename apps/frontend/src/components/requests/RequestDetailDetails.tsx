import { FileText } from 'lucide-react';
import type { VisitRequest } from '@app-types/api';

interface RequestDetailsProps {
  request: VisitRequest;
}

export default function RequestDetails({ request }: RequestDetailsProps) {
  return (
    <section className="rounded-lg border border-surface-alt bg-surface-container-lowest p-6">
      <h2 className="mb-3 flex items-center gap-2 text-label-md font-bold">
        <FileText className="h-5 w-5" /> Detail Permohonan
      </h2>
      <dl className="grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-label-sm text-on-surface-variant">Email</dt>
          <dd>{request.email}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-on-surface-variant">Kontak Dihubungi</dt>
          <dd>{request.kontak_dihubungi}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-on-surface-variant">Alamat Instansi</dt>
          <dd>{request.alamat_instansi}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-on-surface-variant">Pimpinan Rombongan</dt>
          <dd>{request.pimpinan_rombongan}</dd>
        </div>
      </dl>
      <p className="mt-4 leading-relaxed text-on-surface-variant">{request.tema_kunjungan}</p>
    </section>
  );
}
