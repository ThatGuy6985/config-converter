import { createTrojanModel } from '../models/types.js';

export function parseTrojanUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return { success: false, error: 'Input must be a valid string' };
  }

  const trimmed = uri.trim();
  if (!trimmed.toLowerCase().startsWith('trojan://')) {
    return { success: false, error: 'Not a Trojan URI (must start with trojan://)' };
  }

  try {
    const url = new URL(trimmed);
    const password = decodeURIComponent(url.username || '');
    if (!password) {
      return { success: false, error: 'Trojan URI missing password in userinfo' };
    }

    const host = url.hostname;
    if (!host) {
      return { success: false, error: 'Trojan URI missing server hostname/address' };
    }

    let port = parseInt(url.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      port = 443;
    }

    const params = new URLSearchParams(url.search);

    let rawHash = url.hash.replace(/^#/, '');
    let name = '';
    try {
      name = decodeURIComponent(rawHash).trim();
    } catch {
      name = rawHash.trim();
    }
    if (!name) name = `Trojan-${host}:${port}`;

    const transportType = (params.get('type') || 'tcp').toLowerCase();
    const path = params.get('path') || (transportType === 'ws' ? '/' : null);
    const hostHeader = params.get('host') || null;
    const serviceName = params.get('serviceName') || null;
    const sni = params.get('sni') || hostHeader || host;
    const fp = params.get('fp') || 'chrome';
    const alpnRaw = params.get('alpn');
    const alpn = alpnRaw ? alpnRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const model = createTrojanModel({
      metadata: {
        name,
        source: 'uri'
      },
      server: {
        address: host,
        port
      },
      authentication: {
        password
      },
      transport: {
        type: transportType,
        path,
        host: hostHeader,
        serviceName,
        headers: hostHeader ? { Host: hostHeader } : {}
      },
      security: {
        type: 'tls',
        serverName: sni,
        alpn,
        fingerprint: fp
      },
      network: {
        udp: true
      },
      original: {
        raw: trimmed,
        type: 'trojan-uri'
      }
    });

    return { success: true, model };
  } catch (err) {
    return { success: false, error: `Invalid Trojan URI: ${err.message}` };
  }
}
