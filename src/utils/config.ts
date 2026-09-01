export function getBackendUrl(): string {
  // In browser, relative URL connects to same origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}
