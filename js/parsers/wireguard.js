/**
 * Multi-Peer WireGuard & AmneziaWG INI Parser
 */

import { parseEndpoint } from '../utils/endpoint.js';
import { createWireguardModel } from '../models/types.js';

export function parseReservedBytes(val) {
  if (!val) return [0, 0, 0];
  if (Array.isArray(val)) return val.slice(0, 3).map(n => parseInt(n, 10) || 0);
  const clean = String(val).replace(/[\[\]]/g, '');
  const parts = clean.split(',').map(s => parseInt(s.trim(), 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3);
}

export function parseWireguardIni(text, fallbackName = 'WireGuard-Tunnel') {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Input must be a valid string' };
  }

  const lines = text.split(/\r?\n/);
  let currentSection = '';
  
  const iface = {
    privateKey: '',
    addresses: [],
    dns: [],
    mtu: 1280
  };

  const amnezia = {
    jc: 5, jmin: 50, jmax: 100,
    s1: 0, s2: 0, s3: 0, s4: 0,
    h1: 1, h2: 2, h3: 3, h4: 4,
    i1: '', i2: ''
  };

  let hasAwgCustomParams = false;
  const peers = [];
  let currentPeer = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith(';')) {
      continue;
    }

    // Section header
    if (rawLine.startsWith('[') && rawLine.endsWith(']')) {
      const sectionName = rawLine.slice(1, -1).trim().toLowerCase();
      if (sectionName === 'interface') {
        currentSection = 'interface';
      } else if (sectionName === 'peer') {
        currentSection = 'peer';
        currentPeer = {
          publicKey: '',
          endpoint: { host: '', port: 51820 },
          allowedIPs: [],
          persistentKeepalive: 25,
          presharedKey: null
        };
        peers.push(currentPeer);
      } else {
        currentSection = sectionName;
      }
      continue;
    }

    const eqIndex = rawLine.indexOf('=');
    if (eqIndex === -1) continue;

    const key = rawLine.slice(0, eqIndex).trim().toLowerCase();
    const val = rawLine.slice(eqIndex + 1).trim();

    if (currentSection === 'interface') {
      switch (key) {
        case 'privatekey':
          iface.privateKey = val;
          break;
        case 'address':
          iface.addresses = val.split(',').map(s => s.trim()).filter(Boolean);
          break;
        case 'dns':
          iface.dns = val.split(',').map(s => s.trim()).filter(Boolean);
          break;
        case 'mtu': {
          const m = parseInt(val, 10);
          if (!isNaN(m) && m >= 576 && m <= 9000) iface.mtu = m;
          break;
        }
        case 'reserved': {
          const [r1, r2, r3] = parseReservedBytes(val);
          if (amnezia.s1 === 0 && amnezia.s2 === 0 && amnezia.s3 === 0) {
            amnezia.s1 = r1;
            amnezia.s2 = r2;
            amnezia.s3 = r3;
          }
          break;
        }
        case 'jc': amnezia.jc = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'jmin': amnezia.jmin = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'jmax': amnezia.jmax = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 's1': amnezia.s1 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 's2': amnezia.s2 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 's3': amnezia.s3 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 's4': amnezia.s4 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'h1': amnezia.h1 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'h2': amnezia.h2 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'h3': amnezia.h3 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'h4': amnezia.h4 = parseInt(val, 10) || 0; hasAwgCustomParams = true; break;
        case 'i1': amnezia.i1 = val; hasAwgCustomParams = true; break;
        case 'i2': amnezia.i2 = val; hasAwgCustomParams = true; break;
      }
    } else if (currentSection === 'peer' && currentPeer) {
      switch (key) {
        case 'publickey':
          currentPeer.publicKey = val;
          break;
        case 'endpoint': {
          const ep = parseEndpoint(val, 51820);
          if (ep.valid) {
            currentPeer.endpoint = { host: ep.host, port: ep.port };
          } else {
            currentPeer.endpoint = { host: val, port: 51820 };
          }
          break;
        }
        case 'presharedkey':
          currentPeer.presharedKey = val || null;
          break;
        case 'allowedips':
          currentPeer.allowedIPs = val.split(',').map(s => s.trim()).filter(Boolean);
          break;
        case 'persistentkeepalive':
          currentPeer.persistentKeepalive = parseInt(val, 10) || 25;
          break;
      }
    }
  }

  if (!iface.privateKey && peers.length === 0) {
    return { success: false, error: 'No [Interface] with PrivateKey or [Peer] sections found in text' };
  }

  const model = createWireguardModel({
    metadata: {
      name: fallbackName,
      source: 'ini'
    },
    interface: iface,
    peers: peers.length > 0 ? peers : [{
      publicKey: '',
      endpoint: { host: '', port: 51820 },
      allowedIPs: ['0.0.0.0/0', '::/0'],
      persistentKeepalive: 25,
      presharedKey: null
    }],
    amnezia,
    original: {
      raw: text,
      type: 'wireguard-ini'
    }
  });

  return { success: true, model, hasAwgCustomParams };
}
