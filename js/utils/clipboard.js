/**
 * Reusable Asynchronous Clipboard Copy with Fallback
 */

export async function copyText(text) {
  if (typeof text !== 'string') {
    return { success: false, error: 'Clipboard input must be a string' };
  }

  if (!text) {
    return { success: false, error: 'Nothing to copy: text is empty' };
  }

  // 1. Try Modern Clipboard API (works under HTTPS or localhost)
  if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      // Permission denied or insecure context, proceed to fallback
    }
  }

  // 2. Fallback: execCommand with offscreen textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      return { success: true };
    } else {
      return { success: false, error: 'Browser execCommand copy rejected' };
    }
  } catch (fallbackErr) {
    return {
      success: false,
      error: `Clipboard access failed: ${fallbackErr.message || 'Permission denied'}`
    };
  }
}
