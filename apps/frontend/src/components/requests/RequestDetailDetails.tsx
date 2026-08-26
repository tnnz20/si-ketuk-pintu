import { FileText, Mail, MapPin, Phone, User } from 'lucide-react';
import type { VisitRequest } from '@app-types/api';

interface RequestDetailsProps {
  request: VisitRequest;
}

export default function RequestDetailDetails({ request }: RequestDetailsProps) {
  return (
    <div className="bg-civic-surface p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-civic-border pb-3">
        <h3 className="font-extrabold text-base text-civic-dark flex items-center gap-2">
          <FileText className="w-4 h-4 text-civic-muted" />
          <span>Detail Permohonan</span>
        </h3>
        <span className="text-xs text-civic-muted font-medium">Informasi Kontak & Instansi</span>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border space-y-0.5">
          <span className="text-label-sm font-semibold text-civic-muted">Email</span>
          <p className="text-xs font-bold text-civic-dark flex items-center gap-2 break-all">
            <Mail className="w-3.5 h-3.5 text-civic-muted shrink-0" />
            <span>{request.email}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border space-y-0.5">
          <span className="text-label-sm font-semibold text-civic-muted">Kontak Dihubungi</span>
          <p className="text-xs font-bold text-civic-dark flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-civic-muted shrink-0" />
            <span>{request.kontak_dihubungi}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border space-y-0.5">
          <span className="text-label-sm font-semibold text-civic-muted">Alamat Instansi</span>
          <p className="text-xs font-bold text-civic-dark flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-civic-muted shrink-0" />
            <span>{request.alamat_instansi}</span>
          </p>
        </div>

        <div className="bg-civic-cardFill p-3.5 rounded-2xl border border-civic-border space-y-0.5">
          <span className="text-label-sm font-semibold text-civic-muted">Pimpinan Rombongan</span>
          <p className="text-xs font-bold text-civic-dark flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-civic-muted shrink-0" />
            <span>{request.pimpinan_rombongan || '-'}</span>
          </p>
        </div>
      </div>

      {/* Maksud Kunjungan Note Box */}
      <div className="bg-civic-neutralFill/70 p-4 rounded-2xl border border-civic-border space-y-1">
        <span className="text-2xs font-extrabold text-civic-dark uppercase tracking-wider block">
          Maksud & Tema Kunjungan
        </span>
        <p className="text-xs text-civic-dark leading-relaxed font-medium">
          {request.tema_kunjungan}
        </p>
      </div>
    </div>
  );
}
