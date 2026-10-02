/**
 * Complete VLESS URI Parser
 * Format: vless://uuid@host:port?query#name
 */

import { createVlessModel } from '../models/types.js';

export function parseVlessUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return { success: false, error: 'Input must be a valid string' };
  }

  const trimmed = uri.trim();
  if (!trimmed.toLowerCase().startsWith('vless://')) {
    return { success: false, error: 'Not a VLESS URI (must start with vless://)' };
  }

  try {
    const url = new URL(trimmed);
    const uuid = decodeURIComponent(url.username || '');
    if (!uuid) {
      return { success: false, error: 'VLESS URI missing UUID in userinfo' };
    }

    const host = url.hostname;
    if (!host) {
      return { success: false, error: 'VLESS URI missing server hostname/address' };
    }

    const params = new URLSearchParams(url.search);
    const securityRaw = (params.get('security') || 'none').toLowerCase();
    const security = ['tls', 'reality'].includes(securityRaw) ? securityRaw : 'none';

    let port = parseInt(url.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      port = security !== 'none' ? 443 : 80;
    }

    let rawHash = url.hash.replace(/^#/, '');
    let name = '';
    try {
      name = decodeURIComponent(rawHash).trim();
    } catch {
      name = rawHash.trim();
    }
    if (!name) name = `VLESS-${host}:${port}`;

    const transportType = (params.get('type') || 'tcp').toLowerCase();
    const path = params.get('path') || (transportType === 'ws' ? '/' : null);
    const hostHeader = params.get('host') || null;
    const serviceName = params.get('serviceName') || null;
    const sni = params.get('sni') || hostHeader || null;
    const fp = params.get('fp') || 'chrome';
    const pbk = params.get('pbk') || null;
    const sid = params.get('sid') || null;
    const flow = params.get('flow') || null;
    const alpnRaw = params.get('alpn');
    const alpn = alpnRaw ? alpnRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const model = createVlessModel({
      metadata: {
        name,
        source: 'uri'
      },
      server: {
        address: host,
        port
      },
      authentication: {
        uuid
      },
      transport: {
        type: transportType,
        path,
        host: hostHeader,
        serviceName,
        headers: hostHeader ? { Host: hostHeader } : {}
      },
      security: {
        type: security,
        serverName: sni,
        alpn,
        fingerprint: fp,
        publicKey: pbk,
        shortId: sid,
        flow
      },
      network: {
        udp: true
      },
      original: {
        raw: trimmed,
        type: 'vless-uri'
      }
    });

    return { success: true, model };
  } catch (err) {
    return { success: false, error: `Invalid VLESS URI: ${err.message}` };
  }
}
