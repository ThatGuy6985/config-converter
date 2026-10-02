export function isLikelyBase64(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().replace(/\s+/g, '');
  if (clean.length < 8) return false;

  if (/^(vless|vmess|trojan|ss|ssr|hysteria|hy2|wireguard):\/\//i.test(clean)) return false;
  if (clean.startsWith('[Interface]') || clean.startsWith('{') || clean.startsWith('[')) return false;

  return /^[A-Za-z0-9+/_-]+={0,3}$/.test(clean);
}

export function decodeBase64(str) {
  if (!str || typeof str !== 'string') {
    return { success: false, error: 'Input must be a non-empty string' };
  }

  let clean = str.trim().replace(/\s+/g, '');
  if (!clean) {
    return { success: false, error: 'Input is empty after whitespace removal' };
  }

  clean = clean.replace(/-/g, '+').replace(/_/g, '/');

  const mod4 = clean.length % 4;
  if (mod4 === 2) clean += '==';
  else if (mod4 === 3) clean += '=';
  else if (mod4 === 1) {
    return { success: false, error: 'Invalid Base64 length (modulo 4 is 1)' };
  }

  try {
    let binary = '';
    if (typeof Buffer !== 'undefined') {

      const buf = Buffer.from(clean, 'base64');
      const text = buf.toString('utf-8');
      return { success: true, text };
    } else if (typeof atob === 'function') {

      binary = atob(clean);

      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(bytes);
      return { success: true, text };
    } else {
      return { success: false, error: 'No Base64 decoder available in environment' };
    }
  } catch (err) {
    return { success: false, error: `Base64 decode failed: ${err.message}` };
  }
}

export function decodeBase64Safe(str) {
  if (!str || typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (!isLikelyBase64(trimmed)) return str;

  const res = decodeBase64(trimmed);
  if (res.success) {
    const decoded = res.text.trim();

    if (
      decoded.includes('://') ||
      decoded.startsWith('{') ||
      decoded.startsWith('[') ||
      decoded.includes('[Interface]') ||
      decoded.includes('[Peer]') ||
      decoded.includes('\n')
    ) {
      return decoded;
    }
  }
  return str;
}
