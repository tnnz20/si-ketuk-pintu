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
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-neutralFill border border-civic-border text-civic-dark text-xs font-extrabold mb-2">
          <QrCode className="w-3.5 h-3.5" />
          <span>Scanner Portal Admin</span>
        </div>
        <h1 className="text-2xl font-extrabold text-civic-dark tracking-tight">
          Pindai QR Tiket Tamu
        </h1>
        <p className="text-xs text-civic-muted font-medium">
          Arahkan kamera ke tiket QR permohonan kunjungan untuk verifikasi langsung.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-4">
        <div className="flex items-center gap-2 bg-civic-cardFill p-3 rounded-2xl border border-civic-border text-xs text-civic-dark font-medium">
          <ScanLine className="h-4 w-4 text-civic-muted shrink-0" />
          <span>Posisikan QR Code di dalam kotak fokus kamera.</span>
        </div>

        {/* Viewfinder Area */}
        {cameraUnsupported ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-civic-rejectedBg p-8 text-center">
            <CameraOff className="h-8 w-8 text-civic-rejectedText" />
            <p className="text-xs font-bold text-civic-rejectedText">
              Perangkat atau browser Anda tidak mendukung akses kamera langsung.
            </p>
          </div>
        ) : cameraError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-civic-rejectedBg p-8 text-center">
            <CameraOff className="h-8 w-8 text-civic-rejectedText" />
            <p className="text-xs font-bold text-civic-rejectedText">{cameraError}</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-civic-border bg-black/95 aspect-square max-w-sm mx-auto flex items-center justify-center shadow-inner">
            {/* Real Camera Stream Target */}
            <div
              id="qr-reader"
              className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_canvas]:!hidden [&_#qr-canvas-visible]:!hidden [&_img]:!hidden"
            />

            {/* Custom Sleek Overlay Corner Indicators */}
            {isScanningActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 relative">
                  {/* Top-Left Corner */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl shadow-sm" />
                  {/* Top-Right Corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl shadow-sm" />
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl shadow-sm" />
                  {/* Bottom-Right Corner */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl shadow-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="bg-civic-surface p-5 sm:p-6 rounded-3xl border border-civic-border soft-shadow space-y-3.5">
        <h2 className="text-sm font-extrabold text-civic-dark flex items-center gap-2">
          <Camera className="h-4 w-4 text-civic-muted" />
          <span>Kamera Tidak Tersedia?</span>
        </h2>
        <p className="text-xs text-civic-muted font-medium">
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
        <Search className="w-4 h-4 text-civic-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Contoh: SKP-20260819-KYK4D"
          className="w-full bg-civic-cardFill text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-civic-border focus:outline-none focus:border-civic-dark text-civic-dark font-mono transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={!token.trim() || loading}
        className="rounded-2xl bg-civic-dark hover:bg-civic-darkHover px-5 py-2.5 text-xs font-extrabold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm shrink-0"
      >
        {loading ? 'Mencari...' : 'Cari Data'}
      </button>
    </form>
  );
}
