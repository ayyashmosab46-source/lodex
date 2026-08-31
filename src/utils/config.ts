const DEFAULT_PROD_BACKEND_URL = 'https://ais-pre-wjc2flhexp7b76gestgky6-524963037453.europe-west3.run.app';

export function getBackendUrl(): string {
  // 1. Explicit environment variable set at build/runtime
  const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string> }).env : undefined) || {};
  const envBackend = (
    metaEnv.VITE_BACKEND_URL ||
    metaEnv.VITE_SERVER_URL ||
    metaEnv.VITE_API_URL ||
    ''
  ).trim();

  if (envBackend) {
    return envBackend.replace(/\/+$/, '');
  }

  // 2. Browser context checks
  if (typeof window !== 'undefined') {
    // Check URL parameters (e.g. ?backend=https://... or ?server=https://...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryBackend = urlParams.get('backend') || urlParams.get('server');
      if (queryBackend) {
        const cleaned = queryBackend.trim().replace(/\/+$/, '');
        localStorage.setItem('lodeks_backend_url', cleaned);
        return cleaned;
      }
    } catch {
      // Ignore URL parsing errors
    }

    // Check localStorage override
    try {
      const savedBackend = localStorage.getItem('lodeks_backend_url');
      if (savedBackend && savedBackend.startsWith('http')) {
        return savedBackend.trim().replace(/\/+$/, '');
      }
    } catch {
      // Ignore localStorage errors
    }

    const hostname = window.location.hostname;
    const port = window.location.port;

    // Check if hosted on a static Jamstack/SPA platform like Vercel, Netlify, Cloudflare Pages, etc.
    const isStaticHost =
      hostname.endsWith('vercel.app') ||
      hostname.endsWith('now.sh') ||
      hostname.endsWith('netlify.app') ||
      hostname.endsWith('github.io') ||
      hostname.endsWith('pages.dev');

    if (isStaticHost) {
      return DEFAULT_PROD_BACKEND_URL;
    }

    // If local Vite dev server is running on 5173 without proxy
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173') {
      return 'http://localhost:3000';
    }

    // Same-origin (Cloud Run, Docker container, full-stack Express server)
    return window.location.origin;
  }

  return DEFAULT_PROD_BACKEND_URL;
}
