export function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;

  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(str.trim());
}

export function isValidBase64Key(str, expectedLen = 44) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim();

  if (clean.length !== expectedLen) return false;
  return /^[A-Za-z0-9+/]{42,43}={1,2}$/.test(clean);
}

export function isValidPort(port) {
  const p = Number(port);
  return Number.isInteger(p) && p >= 1 && p <= 65535;
}

export function isValidCidr(cidr) {
  if (!cidr || typeof cidr !== 'string') return false;
  const parts = cidr.trim().split('/');
  if (parts.length > 2) return false;
  const ip = parts[0];
  const mask = parts[1];

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    const octets = ip.split('.').map(Number);
    if (octets.some(o => o < 0 || o > 255)) return false;
    if (mask !== undefined) {
      const m = Number(mask);
      return Number.isInteger(m) && m >= 0 && m <= 32;
    }
    return true;
  }

  if (ip.includes(':')) {
    if (mask !== undefined) {
      const m = Number(mask);
      return Number.isInteger(m) && m >= 0 && m <= 128;
    }
    return true;
  }

  return false;
}
