const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const APP_ENV = import.meta.env.VITE_APP_ENV;

interface TurnstileRenderOptions {
  sitekey: string;
  size: 'normal' | 'compact' | 'flexible';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (codes: string[]) => void;
  'response-field'?: boolean;
}

interface TurnstileApi {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function turnstileEnabled(): boolean {
  return APP_ENV === 'production' && !!SITE_KEY;
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else {
          scriptPromise = null;
          reject(new Error('Gagal memuat verifikasi Cloudflare.'));
        }
      };
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Gagal memuat verifikasi Cloudflare.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

const RENDER_TIMEOUT_MS = 60_000;

export async function getTurnstileToken(container: HTMLElement): Promise<string> {
  const turnstile = await loadTurnstile();
  return new Promise<string>((resolve, reject) => {
    let widgetId: string | null = null;
    let done = false;

    const fail = (message: string) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (widgetId !== null) {
        try {
          turnstile.remove(widgetId);
        } catch {
          /* widget already gone */
        }
        widgetId = null;
      }
      reject(new Error(message));
    };

    const timer = window.setTimeout(
      () => fail('Verifikasi membutuhkan waktu terlalu lama. Silakan coba lagi.'),
      RENDER_TIMEOUT_MS,
    );

    container.replaceChildren();
    try {
      widgetId = turnstile.render(container, {
        sitekey: SITE_KEY as string,
        size: 'normal',
        'response-field': false,
        callback: (token) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          turnstile.remove(widgetId as string);
          resolve(token);
        },
        'expired-callback': () => {
          window.clearTimeout(timer);
          fail('Verifikasi kedaluwarsa. Silakan coba lagi.');
        },
        'error-callback': () => {
          window.clearTimeout(timer);
          fail('Verifikasi gagal. Silakan coba lagi.');
        },
      });
    } catch {
      fail('Verifikasi gagal. Silakan coba lagi.');
    }
  });
}
