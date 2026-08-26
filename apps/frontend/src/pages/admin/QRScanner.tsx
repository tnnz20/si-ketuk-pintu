import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Camera, CameraOff, QrCode, ScanLine, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRequestByToken } from '../../lib/api/requests';

const TOKEN_REGEX = /^[A-Za-z0-9-]+$/;
const SCAN_CONFIG: Html5QrcodeCameraScanConfig = {
  fps: 10,
  qrbox: { width: 220, height: 220 },
  aspectRatio: 1.0,
};

const cameraUnsupported =
  typeof navigator === 'undefined' ||
  !('mediaDevices' in navigator) ||
  !('getUserMedia' in navigator.mediaDevices);

export default function QRScanner() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(false);

  const handleScan = useCallback(
    async (raw: string) => {
      if (isProcessingRef.current) return;
      const token = raw.trim();
      if (!TOKEN_REGEX.test(token)) {
        toast.error('QR tidak valid. Pindai ulang atau masukkan token manual.');
        return;
      }

      isProcessingRef.current = true;
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }
        const request = await getRequestByToken(token);
        toast.success(`QR Valid: ${request.token} (${request.nama_instansi})`);
        navigate(`/dashboard/requests/${request.id}`);
      } catch {
        isProcessingRef.current = false;
        toast.error('Token QR tidak ditemukan dalam sistem.');
      }
    },
    [navigate],
  );

  const handleScanRef = useRef(handleScan);

  useEffect(() => {
    handleScanRef.current = handleScan;
  }, [handleScan]);

  useEffect(() => {
    if (cameraUnsupported) return;

    let isMounted = true;
    const elementId = 'qr-reader';
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = '';
    }

    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          SCAN_CONFIG,
          (text) => {
            if (isMounted) {
              void handleScanRef.current(text);
            }
          },
          () => {
            /* ignore per-frame decode attempts */
          },
        );

        if (isMounted) {
          setIsScanningActive(true);
        } else {
          if (scanner.isScanning) {
            await scanner.stop();
          }
          try {
            scanner.clear();
          } catch (e) {
            console.debug('Failed to clear scanner on unmount', e);
          }
        }
      } catch {
        if (isMounted) {
          setCameraError(
            'Akses kamera ditolak atau tidak tersedia. Izinkan akses kamera di browser Anda.',
          );
        }
      }
    };

    void startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              try {
                scannerRef.current?.clear();
              } catch (e) {
                console.debug('Failed to clear scanner after stop', e);
              }
            })
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch (e) {
            console.debug('Failed to clear scanner', e);
          }
        }
      }
    };
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div className="space-y-1 text-center sm:text-left">
        <div className="bg-civic-neutralFill mb-2 inline-flex items-center gap-2 rounded-full border border-civic-border px-3 py-1 text-xs font-extrabold text-civic-dark">
          <QrCode className="h-3.5 w-3.5" />
          <span>Scanner Portal Admin</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-civic-dark">
          Pindai QR Tiket Tamu
        </h1>
        <p className="text-xs font-medium text-civic-muted">
          Arahkan kamera ke tiket QR permohonan kunjungan untuk verifikasi langsung.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="soft-shadow space-y-4 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
        <div className="bg-civic-cardFill flex items-center gap-2 rounded-2xl border border-civic-border p-3 text-xs font-medium text-civic-dark">
          <ScanLine className="h-4 w-4 shrink-0 text-civic-muted" />
          <span>Posisikan QR Code di dalam kotak fokus kamera.</span>
        </div>

        {/* Viewfinder Area */}
        {cameraUnsupported ? (
          <div className="bg-civic-rejectedBg flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 p-8 text-center">
            <CameraOff className="text-civic-rejectedText h-8 w-8" />
            <p className="text-civic-rejectedText text-xs font-bold">
              Perangkat atau browser Anda tidak mendukung akses kamera langsung.
            </p>
          </div>
        ) : cameraError ? (
          <div className="bg-civic-rejectedBg flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 p-8 text-center">
            <CameraOff className="text-civic-rejectedText h-8 w-8" />
            <p className="text-civic-rejectedText text-xs font-bold">{cameraError}</p>
          </div>
        ) : (
          <div className="relative mx-auto flex aspect-square max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-civic-border bg-black/95 shadow-inner">
            {/* Real Camera Stream Target */}
            <div
              id="qr-reader"
              className="h-full w-full [&_#qr-canvas-visible]:!hidden [&_canvas]:!hidden [&_img]:!hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />

            {/* Custom Sleek Overlay Corner Indicators */}
            {isScanningActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-56 w-56">
                  {/* Top-Left Corner */}
                  <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-3 border-l-3 border-white shadow-sm" />
                  {/* Top-Right Corner */}
                  <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-3 border-r-3 border-white shadow-sm" />
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-3 border-l-3 border-white shadow-sm" />
                  {/* Bottom-Right Corner */}
                  <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-xl border-r-3 border-b-3 border-white shadow-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="soft-shadow space-y-3.5 rounded-3xl border border-civic-border bg-civic-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-civic-dark">
          <Camera className="h-4 w-4 text-civic-muted" />
          <span>Kamera Tidak Tersedia?</span>
        </h2>
        <p className="text-xs font-medium text-civic-muted">
          Masukkan nomor token referensi secara manual untuk membuka detail permohonan.
        </p>

        <ManualTokenForm />
      </div>
    </div>
  );
}

function ManualTokenForm() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    try {
      const request = await getRequestByToken(token.trim());
      navigate(`/dashboard/requests/${request.id}`);
    } catch {
      toast.error('Token tidak ditemukan dalam sistem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex gap-2.5 pt-1" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-civic-muted" />
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Contoh: SKP-20260819-KYK4D"
          className="bg-civic-cardFill w-full rounded-2xl border border-civic-border py-2.5 pr-4 pl-10 font-mono text-xs text-civic-dark transition-all focus:border-civic-dark focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={!token.trim() || loading}
        className="hover:bg-civic-darkHover shrink-0 cursor-pointer rounded-2xl bg-civic-dark px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Mencari...' : 'Cari Data'}
      </button>
    </form>
  );
}
