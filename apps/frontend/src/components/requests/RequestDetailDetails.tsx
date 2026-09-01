import { FileText, Mail, MapPin, Phone, User } from 'lucide-react';
import type { VisitRequest } from '@app-types/api';

interface RequestDetailsProps {
  request: VisitRequest;
}

export default function RequestDetailDetails({ request }: RequestDetailsProps) {
  return (
    <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-civic-dark">
          <FileText className="h-4 w-4 text-civic-muted" />
          <span>Detail Permohonan</span>
        </h3>
        <span className="text-xs font-medium text-civic-muted">Informasi Kontak & Instansi</span>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="bg-civic-cardFill space-y-0.5 rounded-2xl border border-civic-border p-3.5">
          <span className="text-label-sm font-semibold text-civic-muted">Email</span>
          <p className="flex items-center gap-2 text-xs font-bold break-all text-civic-dark">
            <Mail className="h-3.5 w-3.5 shrink-0 text-civic-muted" />
            <span>{request.email}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill space-y-0.5 rounded-2xl border border-civic-border p-3.5">
          <span className="text-label-sm font-semibold text-civic-muted">Kontak Dihubungi</span>
          <p className="flex items-center gap-2 text-xs font-bold text-civic-dark">
            <Phone className="h-3.5 w-3.5 shrink-0 text-civic-muted" />
            <span>{request.kontak_dihubungi}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill space-y-0.5 rounded-2xl border border-civic-border p-3.5">
          <span className="text-label-sm font-semibold text-civic-muted">Alamat Instansi</span>
          <p className="flex items-center gap-2 text-xs font-bold text-civic-dark">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-civic-muted" />
            <span>{request.alamat_instansi}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill space-y-0.5 rounded-2xl border border-civic-border p-3.5">
          <span className="text-label-sm font-semibold text-civic-muted">Pimpinan Rombongan</span>
          <p className="flex items-center gap-2 text-xs font-bold text-civic-dark">
            <User className="h-3.5 w-3.5 shrink-0 text-civic-muted" />
            <span>{request.pimpinan_rombongan || '-'}</span>
          </p>
        </div>
      </div>

      {/* Maksud Kunjungan Note Box */}
      <div className="bg-civic-neutralFill/70 space-y-1 rounded-2xl border border-civic-border p-4">
        <span className="block text-2xs font-extrabold tracking-wider text-civic-dark uppercase">
          Maksud & Tema Kunjungan
        </span>
        <p className="text-xs leading-relaxed font-medium text-civic-dark">
          {request.tema_kunjungan}
        </p>
      </div>
    </div>
  );
}
