/**
 * Robust QR Code Generation Helper
 * Integrates with QRCode.js while providing payload size validation and graceful fallbacks.
 */

export function renderQrCode(containerEl, errorEl, text, options = {}) {
  if (!containerEl) return { success: false, error: 'Container element not found' };

  containerEl.innerHTML = '';
  if (errorEl) errorEl.textContent = '';

  const trimmed = (text || '').trim();
  if (!trimmed) {
    if (errorEl) errorEl.textContent = 'Configuration output is empty. Nothing to generate QR for.';
    return { success: false, error: 'Empty text' };
  }

  // QR Code standard binary byte capacity: Level L max ~2953 bytes, Level M max ~2331 bytes
  // Alphanumeric is slightly higher, but JSON/YAML/URIs contain binary symbols.
  if (trimmed.length > 2300) {
    const msg = 'QR unavailable: payload exceeds standard QR code density (~2.3 KB). Please use Copy or Download instead.';
    if (errorEl) errorEl.textContent = msg;
    return { success: false, error: msg };
  }

  if (typeof window === 'undefined' || typeof window.QRCode === 'undefined') {
    const msg = 'QRCode library is not loaded.';
    if (errorEl) errorEl.textContent = msg;
    return { success: false, error: msg };
  }

  try {
    const width = options.width || 220;
    const height = options.height || 220;
    const correctLevel = window.QRCode.CorrectLevel?.M || 0;

    new window.QRCode(containerEl, {
      text: trimmed,
      width,
      height,
      colorDark: options.colorDark || '#000000',
      colorLight: options.colorLight || '#ffffff',
      correctLevel
    });

    return { success: true };
  } catch (err) {
    containerEl.innerHTML = '';
    const msg = 'QR generation failed: payload is too dense or complex for a single symbol. Use Copy or Download.';
    if (errorEl) errorEl.textContent = msg;
    return { success: false, error: err.message };
  }
}
