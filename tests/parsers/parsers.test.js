import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseVlessUri } from '../../js/parsers/vless.js';
import { parseTrojanUri } from '../../js/parsers/trojan.js';
import { parseVmessUri } from '../../js/parsers/vmess.js';
import { parseWireguardIni } from '../../js/parsers/wireguard.js';
import { decodeBase64, isLikelyBase64 } from '../../js/utils/base64.js';
import { parseEndpoint } from '../../js/utils/endpoint.js';
import { detectInputType, parseAllInputs } from '../../js/parsers/detector.js';

import {
  SAMPLE_VLESS_REALITY,
  SAMPLE_VLESS_WS,
  SAMPLE_VLESS_GRPC,
  SAMPLE_TROJAN_BASIC,
  SAMPLE_TROJAN_WS,
  SAMPLE_VMESS_BASE64,
  SAMPLE_WIREGUARD_SINGLE_PEER,
  SAMPLE_WIREGUARD_MULTI_PEER_AWG
} from '../fixtures/sample-configs.js';

describe('VLESS Parser', () => {
  it('should correctly parse VLESS Reality URI with full fields', () => {
    const res = parseVlessUri(SAMPLE_VLESS_REALITY);
    assert.equal(res.success, true);
    assert.equal(res.model.protocol, 'vless');
    assert.equal(res.model.metadata.name, 'VLESS Reality US');
    assert.equal(res.model.server.address, 'cloudflare.com');
    assert.equal(res.model.server.port, 443);
    assert.equal(res.model.authentication.uuid, 'b0e77457-3f8d-4f10-9118-dfb79872e612');
    assert.equal(res.model.authentication.password, null, 'VLESS must not populate password field');
    assert.equal(res.model.security.type, 'reality');
    assert.equal(res.model.security.serverName, 'zoom.us');
    assert.equal(res.model.security.fingerprint, 'chrome');
    assert.equal(res.model.security.publicKey, '1yH_K5F1q5N5Z8X9V4B7N1M2K3L4P5O6I7U8Y9T0R1E');
    assert.equal(res.model.security.shortId, 'ab12cd34');
    assert.equal(res.model.security.flow, 'xtls-rprx-vision');
  });

  it('should parse VLESS WebSocket with custom path and host', () => {
    const res = parseVlessUri(SAMPLE_VLESS_WS);
    assert.equal(res.success, true);
    assert.equal(res.model.server.address, 'speedtest.net');
    assert.equal(res.model.server.port, 80);
    assert.equal(res.model.transport.type, 'ws');
    assert.equal(res.model.transport.path, '/custom-ws');
    assert.equal(res.model.transport.host, 'my-cdn.com');
  });

  it('should parse VLESS gRPC with serviceName', () => {
    const res = parseVlessUri(SAMPLE_VLESS_GRPC);
    assert.equal(res.success, true);
    assert.equal(res.model.transport.type, 'grpc');
    assert.equal(res.model.transport.serviceName, 'my-grpc-service');
    assert.equal(res.model.security.fingerprint, 'safari');
  });

  it('should reject invalid or non-VLESS URI', () => {
    assert.equal(parseVlessUri('invalid-string').success, false);
    assert.equal(parseVlessUri('trojan://test@host.com:443').success, false);
    assert.equal(parseVlessUri('vless://@host.com:443').success, false);
  });
});

describe('Trojan Parser', () => {
  it('should parse Trojan password and TLS SNI correctly without treating password as UUID', () => {
    const res = parseTrojanUri(SAMPLE_TROJAN_BASIC);
    assert.equal(res.success, true);
    assert.equal(res.model.protocol, 'trojan');
    assert.equal(res.model.server.address, 'trojan.example.com');
    assert.equal(res.model.server.port, 443);
    assert.equal(res.model.authentication.password, 'mySecretPass123');
    assert.equal(res.model.authentication.uuid, null, 'Trojan must not populate UUID field');
    assert.equal(res.model.security.type, 'tls');
    assert.equal(res.model.security.serverName, 'trojan.example.com');
    assert.deepEqual(res.model.security.alpn, ['h2', 'http/1.1']);
  });

  it('should parse Trojan WebSocket parameters', () => {
    const res = parseTrojanUri(SAMPLE_TROJAN_WS);
    assert.equal(res.success, true);
    assert.equal(res.model.transport.type, 'ws');
    assert.equal(res.model.transport.path, '/trojan-path');
    assert.equal(res.model.authentication.password, 'secureTrojanPswd');
  });
});

describe('VMess Parser', () => {
  it('should parse VMess Base64 JSON and preserve all fields', () => {
    const res = parseVmessUri(SAMPLE_VMESS_BASE64);
    assert.equal(res.success, true);
    assert.equal(res.model.protocol, 'vmess');
    assert.equal(res.model.metadata.name, 'VMess Test Node');
    assert.equal(res.model.server.address, 'vmess.example.com');
    assert.equal(res.model.server.port, 443);
    assert.equal(res.model.authentication.uuid, 'd9b8a7c6-b5a4-3210-9876-543210abcdef');
    assert.equal(res.model.authentication.alterId, 0);
    assert.equal(res.model.authentication.cipher, 'auto');
    assert.equal(res.model.transport.type, 'ws');
    assert.equal(res.model.transport.path, '/vmess-ws');
    assert.equal(res.model.security.type, 'tls');
  });

  it('should reject malformed VMess payloads', () => {
    assert.equal(parseVmessUri('vmess://not-valid-base64!@#').success, false);
    assert.equal(parseVmessUri('vmess://').success, false);
  });
});

describe('WireGuard & AmneziaWG Parser', () => {
  it('should parse single peer WireGuard INI with IPv4 and IPv6', () => {
    const res = parseWireguardIni(SAMPLE_WIREGUARD_SINGLE_PEER);
    assert.equal(res.success, true);
    assert.equal(res.model.protocol, 'wireguard');
    assert.equal(res.model.interface.privateKey, 'aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxkMTI=');
    assert.deepEqual(res.model.interface.addresses, ['10.0.0.2/32', 'fd00::2/128']);
    assert.equal(res.model.interface.mtu, 1360);
    assert.equal(res.model.peers.length, 1);
    assert.equal(res.model.peers[0].publicKey, 'dGVzdHB1YmxpY2tleXRlc3RwdWJsaWNrZXl0ZXN0MTI=');
    assert.equal(res.model.peers[0].presharedKey, 'dGVzdHByZXNoYXJlZGtleXRlc3RwcmVzaGFyZWQxMg==');
    assert.equal(res.model.peers[0].endpoint.host, '198.51.100.1');
    assert.equal(res.model.peers[0].endpoint.port, 51820);
    assert.equal(res.model.peers[0].persistentKeepalive, 20);
  });

  it('should parse multiple peers without overwriting and preserve Amnezia parameters', () => {
    const res = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG);
    assert.equal(res.success, true);
    assert.equal(res.model.peers.length, 2, 'Must preserve both peers');
    assert.equal(res.model.peers[0].publicKey, 'cGVlcjFwdWJsaWNrZXlwZWVyMXB1YmxpY2tleXRlc3Q=');
    assert.equal(res.model.peers[0].endpoint.host, '203.0.113.10');
    assert.equal(res.model.peers[1].publicKey, 'cGVlcjJwdWJsaWNrZXlwZWVyMnB1YmxpY2tleXRlc3Q=');
    assert.equal(res.model.peers[1].endpoint.host, '2001:db8::10');
    assert.equal(res.model.peers[1].endpoint.port, 51820);

    // AmneziaWG parameters
    assert.equal(res.model.amnezia.jc, 7);
    assert.equal(res.model.amnezia.jmin, 65);
    assert.equal(res.model.amnezia.jmax, 191);
    assert.equal(res.model.amnezia.s1, 15);
    assert.equal(res.model.amnezia.s2, 25);
    assert.equal(res.model.amnezia.h1, 123456);
    assert.equal(res.model.amnezia.h2, 654321);
    assert.equal(res.model.amnezia.h3, 987654);
    assert.equal(res.model.amnezia.h4, 456789);
  });
});

describe('Base64 Utility', () => {
  it('should decode standard and URL-safe Base64 with missing padding', () => {
    const text = 'Hello, World! Universal Proxy Converter test 123';
    const b64 = Buffer.from(text).toString('base64');
    const urlSafeWithoutPadding = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = decodeBase64(urlSafeWithoutPadding);
    assert.equal(res.success, true);
    assert.equal(res.text, text);
  });

  it('should identify likely Base64 strings correctly', () => {
    assert.equal(isLikelyBase64('aGVsbG8gd29ybGQ='), true);
    assert.equal(isLikelyBase64('vless://uuid@host:443'), false);
    assert.equal(isLikelyBase64('[Interface]\nPrivateKey=...'), false);
    assert.equal(isLikelyBase64('short'), false);
  });
});

describe('Endpoint Parser', () => {
  it('should parse standard host:port and IPv4:port', () => {
    const res1 = parseEndpoint('example.com:443');
    assert.equal(res1.valid, true);
    assert.equal(res1.host, 'example.com');
    assert.equal(res1.port, 443);

    const res2 = parseEndpoint('1.2.3.4:8080');
    assert.equal(res2.valid, true);
    assert.equal(res2.host, '1.2.3.4');
    assert.equal(res2.port, 8080);
  });

  it('should parse IPv6 with brackets [2001:db8::1]:51820', () => {
    const res = parseEndpoint('[2001:db8::1]:51820');
    assert.equal(res.valid, true);
    assert.equal(res.host, '2001:db8::1');
    assert.equal(res.port, 51820);
    assert.equal(res.isIpv6, true);
  });

  it('should fallback to default port if port is omitted', () => {
    const res = parseEndpoint('example.com', 51820);
    assert.equal(res.valid, true);
    assert.equal(res.host, 'example.com');
    assert.equal(res.port, 51820);
  });

  it('should reject invalid ports or malformed endpoints', () => {
    assert.equal(parseEndpoint('example.com:99999').valid, false);
    assert.equal(parseEndpoint('example.com:0').valid, false);
    assert.equal(parseEndpoint('example.com:abc').valid, false);
    assert.equal(parseEndpoint('2001:db8::1:51820').valid, false, 'Unbracketed IPv6 with port must be rejected');
  });
});

describe('Input Detector & Multi-Input Parsing', () => {
  it('should detect input formats accurately', () => {
    assert.equal(detectInputType(SAMPLE_VLESS_REALITY), 'vless-uri');
    assert.equal(detectInputType(SAMPLE_TROJAN_BASIC), 'trojan-uri');
    assert.equal(detectInputType(SAMPLE_VMESS_BASE64), 'vmess-uri');
    assert.equal(detectInputType(SAMPLE_WIREGUARD_SINGLE_PEER), 'wireguard-ini');
    assert.equal(detectInputType('https://sub.example.com/api/v1/client/subscribe?token=xyz'), 'subscription-url');
  });

  it('should parse multiline mixed inputs correctly', () => {
    const mixed = `${SAMPLE_VLESS_REALITY}\n${SAMPLE_TROJAN_BASIC}\n${SAMPLE_VMESS_BASE64}`;
    const res = parseAllInputs(mixed);
    assert.equal(res.success, true);
    assert.equal(res.configs.length, 3);
    assert.equal(res.configs[0].protocol, 'vless');
    assert.equal(res.configs[1].protocol, 'trojan');
    assert.equal(res.configs[2].protocol, 'vmess');
  });
});
