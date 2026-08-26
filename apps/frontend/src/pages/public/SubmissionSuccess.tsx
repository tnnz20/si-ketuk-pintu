import { CheckCircle, Copy, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/shared/Tooltip';
import { downloadQR } from '../../lib/api/requests';

export default function SubmissionSuccess() {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [params] = useSearchParams();
  const token = params.get('token') || 'SKP-20240520-A7B8C';

  useEffect(() => {
    let url = '';
    downloadQR(token)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setQrUrl(url);
      })
      .catch(() => setQrUrl(''));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [token]);

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = async () => {
    const blob = await downloadQR(token);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${token}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex grow flex-col items-center justify-center px-margin-mobile py-16 md:px-margin-desktop md:py-24">
      <div className="w-full max-w-2xl rounded-xl border border-surface-alt bg-surface-container-lowest p-8 text-center md:p-12">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h1 className="font-headline-lg mb-4 text-headline-lg-mobile text-primary md:text-headline-lg">
          Pengajuan Berhasil
        </h1>
        <p className="font-body-md mb-8 text-body-md text-on-surface-variant">
          Pengajuan kunjungan Anda telah berhasil dicatat dengan aman di sistem Si Ketuk Pintu.
        </p>
        <div className="relative mb-8 rounded-lg border border-surface-alt bg-surface-container-low p-6">
          <p className="font-label-sm mb-2 text-label-sm tracking-wider text-on-surface-variant uppercase">
            Token Kunjungan Anda
          </p>
          <div className="flex items-center justify-center gap-4">
            <span
              className="font-headline-md text-headline-md font-bold tracking-widest text-primary"
              id="token-text"
            >
              {token}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={copyToken}
                  className="cursor-pointer text-on-surface-variant hover:text-primary"
                  aria-label="Salin token"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5 text-secondary" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Token tersalin' : 'Salin token'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded border border-surface-alt bg-white p-4 shadow-sm">
            {qrUrl ? (
              <img src={qrUrl} alt="Kode QR" className="h-48 w-48 object-contain" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center text-label-sm text-on-surface-variant">
                Memuat Kode QR...
              </div>
            )}
          </div>
          <p className="font-body-md max-w-sm text-body-md text-on-surface-variant">
            Simpan token dan kode QR Anda untuk memeriksa status kunjungan nanti di meja keamanan.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={downloadQr}
            className="font-label-md flex cursor-pointer items-center justify-center gap-2 rounded bg-primary px-6 py-3 text-label-md text-on-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
          >
            <Download className="h-4 w-4" /> Unduh Kode QR (PNG)
          </button>
          <Link
            to="/"
            className="font-label-md cursor-pointer rounded border border-surface-alt bg-transparent px-6 py-3 text-label-md text-primary hover:bg-surface-container focus:ring-2 focus:ring-primary focus:outline-none"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
