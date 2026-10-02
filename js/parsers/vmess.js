import { decodeBase64 } from '../utils/base64.js';
import { createVmessModel } from '../models/types.js';

export function parseVmessUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return { success: false, error: 'Input must be a valid string' };
  }

  const trimmed = uri.trim();
  if (!trimmed.toLowerCase().startsWith('vmess://')) {
    return { success: false, error: 'Not a VMess URI (must start with vmess://)' };
  }

  const b64 = trimmed.slice(8);
  const decodeResult = decodeBase64(b64);
  if (!decodeResult.success) {
    return { success: false, error: `Invalid VMess Base64 payload: ${decodeResult.error}` };
  }

  let json;
  try {
    json = JSON.parse(decodeResult.text);
  } catch (err) {
    return { success: false, error: `VMess JSON decode failed: ${err.message}` };
  }

  if (typeof json !== 'object' || json === null) {
    return { success: false, error: 'VMess payload is not a valid JSON object' };
  }

  const uuid = json.id || json.uuid || '';
  if (!uuid) {
    return { success: false, error: 'VMess JSON missing client UUID (id)' };
  }

  const address = json.add || json.address || '';
  if (!address) {
    return { success: false, error: 'VMess JSON missing server address (add)' };
  }

  const port = parseInt(json.port, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    return { success: false, error: `Invalid VMess server port: ${json.port}` };
  }

  const name = json.ps || `VMess-${address}:${port}`;
  const net = (json.net || 'tcp').toLowerCase();
  const alterId = parseInt(json.aid, 10) || 0;
  const cipher = json.scy || json.cipher || 'auto';
  const tls = (json.tls || '').toLowerCase() === 'tls';
  const host = json.host || '';
  const path = json.path || (net === 'ws' ? '/' : null);
  const sni = json.sni || host || address;
  const alpnRaw = json.alpn;
  const alpn = alpnRaw ? (Array.isArray(alpnRaw) ? alpnRaw : String(alpnRaw).split(',').map(s => s.trim())) : [];
  const fp = json.fp || 'chrome';
  const serviceName = (net === 'grpc' ? (path || host || null) : null);

  const model = createVmessModel({
    metadata: {
      name,
      source: 'json'
    },
    server: {
      address,
      port
    },
    authentication: {
      uuid,
      alterId,
      cipher
    },
    transport: {
      type: net,
      path,
      host: host || null,
      serviceName,
      headers: host ? { Host: host } : {}
    },
    security: {
      type: tls ? 'tls' : 'none',
      serverName: tls ? sni : null,
      alpn,
      fingerprint: tls ? fp : null
    },
    network: {
      udp: true
    },
    original: {
      raw: trimmed,
      type: 'vmess-uri'
    }
  });

  return { success: true, model };
}
