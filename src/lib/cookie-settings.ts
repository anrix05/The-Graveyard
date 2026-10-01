/**
 * Helper to open the Cookie & Privacy Settings dialog.
 */
export function openCookieSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('graveyard:open-cookie-settings'));
  }
}
