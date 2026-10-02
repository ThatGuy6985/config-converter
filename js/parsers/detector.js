/**
 * Input Detection and Multi-Input Parsing Coordinator
 * Deliberate detection order:
 * 1. Subscription URL
 * 2. Full JSON (Xray / Sing-box / v2rayN)
 * 3. WireGuard INI
 * 4. Base64 encoded payload
 * 5. Multi-line URI links (vless, vmess, trojan)
 */

import { decodeBase64Safe, isLikelyBase64 } from '../utils/base64.js';
import { parseVlessUri } from './vless.js';
import { parseVmessUri } from './vmess.js';
import { parseTrojanUri } from './trojan.js';
import { parseWireguardIni } from './wireguard.js';

export function detectInputType(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return 'unknown';
  const text = rawInput.trim();
  if (!text) return 'unknown';

  // 1. Subscription URL
  if (/^https?:\/\/[^\s]+$/i.test(text)) {
    return 'subscription-url';
  }

  // 2. Full JSON
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.outbounds || parsed.inbounds || parsed.routing) {
        return parsed.route ? 'singbox-json' : 'xray-json';
      }
      if (parsed.v && parsed.add) return 'vmess-json';
      return 'json';
    } catch {}
  }

  // 3. WireGuard INI
  if (/\[interface\]/i.test(text) && (/\[peer\]/i.test(text) || /privatekey/i.test(text))) {
    return 'wireguard-ini';
  }

  // 4. Base64 Encoded Content
  if (isLikelyBase64(text)) {
    return 'base64';
  }

  // 5. Check URIs
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const protocols = lines.map(line => {
      const match = line.match(/^([a-zA-Z0-9]+):\/\//);
      return match ? match[1].toLowerCase() : null;
    }).filter(Boolean);

    if (protocols.length === 1 && lines.length === 1) {
      if (protocols[0] === 'vless') return 'vless-uri';
      if (protocols[0] === 'vmess') return 'vmess-uri';
      if (protocols[0] === 'trojan') return 'trojan-uri';
    } else if (protocols.length > 0) {
      return 'mixed-uris';
    }
  }

  return 'unknown';
}

export function parseAllInputs(rawInput, defaultName = 'Config-1') {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      success: false,
      detectedType: 'unknown',
      configs: [],
      errors: ['No input provided'],
      warnings: []
    };
  }

  let text = rawInput.trim();
  const detectedType = detectInputType(text);

  // If detected as base64 or contains base64 subscription, attempt safe decode
  if (detectedType === 'base64') {
    text = decodeBase64Safe(text);
  }

  const results = [];
  const errors = [];
  const warnings = [];

  // 1. Check if it's WireGuard INI
  if (/\[interface\]/i.test(text) && (/\[peer\]/i.test(text) || /privatekey/i.test(text))) {
    const wgRes = parseWireguardIni(text, defaultName);
    if (wgRes.success) {
      results.push(wgRes.model);
      return {
        success: true,
        detectedType: 'wireguard-ini',
        configs: results,
        errors,
        warnings
      };
    } else {
      errors.push(`WireGuard parsing failed: ${wgRes.error}`);
    }
  }

  // 2. Check line by line for URIs or embedded payloads
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let parsedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().startsWith('vless://')) {
      const res = parseVlessUri(line);
      if (res.success) {
        if (lines.length > 1) res.model.metadata.name = `${res.model.metadata.name || defaultName}-${i + 1}`;
        results.push(res.model);
        parsedCount++;
      } else {
        errors.push(`Line ${i + 1}: ${res.error}`);
      }
    } else if (line.toLowerCase().startsWith('vmess://')) {
      const res = parseVmessUri(line);
      if (res.success) {
        if (lines.length > 1) res.model.metadata.name = `${res.model.metadata.name || defaultName}-${i + 1}`;
        results.push(res.model);
        parsedCount++;
      } else {
        errors.push(`Line ${i + 1}: ${res.error}`);
      }
    } else if (line.toLowerCase().startsWith('trojan://')) {
      const res = parseTrojanUri(line);
      if (res.success) {
        if (lines.length > 1) res.model.metadata.name = `${res.model.metadata.name || defaultName}-${i + 1}`;
        results.push(res.model);
        parsedCount++;
      } else {
        errors.push(`Line ${i + 1}: ${res.error}`);
      }
    } else if (isLikelyBase64(line)) {
      // Possible single-line Base64 containing a URI
      const decodedLine = decodeBase64Safe(line);
      if (decodedLine !== line && decodedLine.includes('://')) {
        const subResult = parseAllInputs(decodedLine, `${defaultName}-${i + 1}`);
        results.push(...subResult.configs);
        errors.push(...subResult.errors);
      }
    }
  }

  return {
    success: results.length > 0,
    detectedType,
    configs: results,
    errors,
    warnings
  };
}
