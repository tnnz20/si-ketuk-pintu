import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRequestByToken } from '../../lib/api/requests';

const TOKEN_REGEX = /^[A-Za-z0-9-]+$/;
const SCAN_CONFIG: Html5QrcodeCameraScanConfig = { fps: 10, qrbox: { width: 240, height: 240 } };

const cameraUnsupported =
  typeof navigator === 'undefined' ||
  !('mediaDevices' in navigator) ||
  !('getUserMedia' in navigator.mediaDevices);

export default function QRScanner() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState('');

  const handleScan = useCallback(
    async (raw: string) => {
      const token = raw.trim();
      if (!TOKEN_REGEX.test(token)) {
        toast.error('QR tidak valid. Pindai ulang atau masukkan token manual.');
        return;
      }
      try {
        const request = await getRequestByToken(token);
        navigate(`/dashboard/requests/${request.id}`);
      } catch {
        toast.error('Token QR tidak ditemukan.');
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (cameraUnsupported) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    toast.info('Izinkan akses kamera untuk memulai pemindaian.');

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          SCAN_CONFIG,
          (text) => {
            void handleScan(text);
          },
          () => {
            /* ignore per-frame errors */
          },
        );
      } catch {
        setCameraError(
          'Akses kamera ditolak atau tidak tersedia. Izinkan kamera di browser, lalu muat ulang halaman.',
        );
      }
    };

    void start();

    return () => {
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop();
      }
    };
  }, [handleScan]);

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-primary">Pindai Kode QR</h1>
        <p className="mt-1 text-on-surface-variant">
          Arahkan kamera ke kode QR permohonan untuk membuka detailnya.
        </p>
      </header>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-4 flex items-center gap-2 rounded bg-surface-container p-3 text-label-md text-on-surface-variant">
          <ScanLine className="h-5 w-5" />
          <span>Bila diminta, izinkan browser untuk mengakses kamera Anda.</span>
        </div>

        {cameraUnsupported ? (
          <div className="flex flex-col items-center gap-3 rounded border border-error/30 bg-error/5 p-6 text-center">
            <CameraOff className="h-8 w-8 text-error" />
            <p className="text-label-md text-error">
              Perangkat atau browser Anda tidak mendukung akses kamera.
            </p>
          </div>
        ) : cameraError ? (
          <div className="flex flex-col items-center gap-3 rounded border border-error/30 bg-error/5 p-6 text-center">
            <CameraOff className="h-8 w-8 text-error" />
            <p className="text-label-md text-error">{cameraError}</p>
          </div>
        ) : (
          <div id="qr-reader" className="[&_video]:w-full [&_video]:rounded-lg" />
        )}
      </section>

      <section className="mt-6 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="mb-3 flex items-center gap-2 text-label-md font-bold">
          <Camera className="h-5 w-5" /> Kamera tidak tersedia?
        </h2>
        <p className="mb-2 text-on-surface-variant">
          Masukkan token secara manual untuk membuka detail permohonan.
        </p>
        <ManualTokenForm />
      </section>
    </div>
  );
}

function ManualTokenForm() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const request = await getRequestByToken(token.trim());
      navigate(`/dashboard/requests/${request.id}`);
    } catch {
      toast.error('Token tidak ditemukan.');
    }
  }

  return (
    <form className="flex gap-3" onSubmit={handleSubmit}>
      <input
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="SKP-YYYYMMDD-XXXXX"
        className="min-w-0 flex-1 rounded border border-outline-variant bg-white px-3 py-2"
      />
      <button
        type="submit"
        disabled={!token.trim()}
        className="rounded bg-primary px-4 py-2 text-label-md text-on-primary disabled:opacity-50"
      >
        Cari
      </button>
    </form>
  );
}
