import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseVlessUri } from '../../js/parsers/vless.js';
import { parseTrojanUri } from '../../js/parsers/trojan.js';
import { parseWireguardIni } from '../../js/parsers/wireguard.js';

import { buildClashConfig, buildClashTrojan, buildClashVless } from '../../js/exporters/clash.js';
import { buildSingBoxConfig, buildSingBoxTrojan, buildSingBoxVless } from '../../js/exporters/singbox.js';
import { buildXrayJsonConfig, buildXrayTrojan, buildXrayVless } from '../../js/exporters/xray.js';
import { buildAmneziaWG } from '../../js/exporters/amnezia.js';

import {
  SAMPLE_VLESS_REALITY,
  SAMPLE_TROJAN_BASIC,
  SAMPLE_WIREGUARD_MULTI_PEER_AWG
} from '../fixtures/sample-configs.js';

describe('Clash Meta Exporter', () => {
  it('should export VLESS Reality with reality-opts and fingerprint', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const yaml = buildClashConfig([vless]);

    assert.ok(yaml.includes('type: vless'));
    assert.ok(yaml.includes('tls: true'));
    assert.ok(yaml.includes('reality-opts:'));
    assert.ok(yaml.includes('public-key: "1yH_K5F1q5N5Z8X9V4B7N1M2K3L4P5O6I7U8Y9T0R1E"'));
    assert.ok(yaml.includes('short-id: "ab12cd34"'));
    assert.ok(yaml.includes('flow: "xtls-rprx-vision"'));
    assert.ok(yaml.includes('allow-lan: false'), 'Must default to secure local listening');
  });

  it('should export Trojan with password field and NEVER with uuid', () => {
    const trojan = parseTrojanUri(SAMPLE_TROJAN_BASIC).model;
    const trojanObj = buildClashTrojan(trojan);

    assert.equal(trojanObj.type, 'trojan');
    assert.equal(trojanObj.password, 'mySecretPass123');
    assert.equal(trojanObj.uuid, undefined, 'Clash Trojan must never have uuid');

    const yaml = buildClashConfig([trojan]);
    assert.ok(yaml.includes('password: "mySecretPass123"'));
    assert.ok(!yaml.includes('uuid: "mySecretPass123"'));
  });

  it('should export WireGuard tunnel correctly', () => {
    const wg = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    const yaml = buildClashConfig([wg]);

    assert.ok(yaml.includes('type: wireguard'));
    assert.ok(yaml.includes('private-key: "aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxkMTI="'));
    assert.ok(yaml.includes('public-key: "cGVlcjFwdWJsaWNrZXlwZWVyMXB1YmxpY2tleXRlc3Q="'));
    assert.ok(yaml.includes('server: "203.0.113.10"'));
  });
});

describe('Sing-Box Exporter', () => {
  it('should export VLESS Reality with correct tls.reality schema', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const singboxObj = buildSingBoxVless(vless);

    assert.equal(singboxObj.type, 'vless');
    assert.equal(singboxObj.uuid, 'b0e77457-3f8d-4f10-9118-dfb79872e612');
    assert.equal(singboxObj.flow, 'xtls-rprx-vision');
    assert.equal(singboxObj.tls.enabled, true);
    assert.equal(singboxObj.tls.reality.enabled, true);
    assert.equal(singboxObj.tls.reality.public_key, '1yH_K5F1q5N5Z8X9V4B7N1M2K3L4P5O6I7U8Y9T0R1E');
    assert.equal(singboxObj.tls.reality.short_id, 'ab12cd34');
    assert.equal(singboxObj.tls.utls.fingerprint, 'chrome');
  });

  it('should export Trojan with password field and NEVER with uuid', () => {
    const trojan = parseTrojanUri(SAMPLE_TROJAN_BASIC).model;
    const singboxObj = buildSingBoxTrojan(trojan);

    assert.equal(singboxObj.type, 'trojan');
    assert.equal(singboxObj.password, 'mySecretPass123');
    assert.equal(singboxObj.uuid, undefined, 'Sing-Box Trojan outbound must not have uuid field');
  });

  it('should configure listen on 127.0.0.1 by default for mixed-in', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const fullConfig = buildSingBoxConfig([vless]);
    assert.equal(fullConfig.inbounds[0].listen, '127.0.0.1');
  });
});

describe('Xray Exporter', () => {
  it('should export Trojan using servers array and password, NEVER vnext or uuid', () => {
    const trojan = parseTrojanUri(SAMPLE_TROJAN_BASIC).model;
    const xrayObj = buildXrayTrojan(trojan);

    assert.equal(xrayObj.protocol, 'trojan');
    assert.ok(xrayObj.settings.servers, 'Xray Trojan must have settings.servers');
    assert.equal(xrayObj.settings.vnext, undefined, 'Xray Trojan must NOT have settings.vnext');
    assert.equal(xrayObj.settings.servers[0].password, 'mySecretPass123');
  });

  it('should export VLESS Reality with vnext and streamSettings.realitySettings', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const xrayObj = buildXrayVless(vless);

    assert.equal(xrayObj.protocol, 'vless');
    assert.equal(xrayObj.settings.vnext[0].users[0].id, 'b0e77457-3f8d-4f10-9118-dfb79872e612');
    assert.equal(xrayObj.settings.vnext[0].users[0].flow, 'xtls-rprx-vision');
    assert.equal(xrayObj.streamSettings.security, 'reality');
    assert.equal(xrayObj.streamSettings.realitySettings.serverName, 'zoom.us');
    assert.equal(xrayObj.streamSettings.realitySettings.publicKey, '1yH_K5F1q5N5Z8X9V4B7N1M2K3L4P5O6I7U8Y9T0R1E');
    assert.equal(xrayObj.streamSettings.realitySettings.shortId, 'ab12cd34');
  });

  it('should default inbound to 127.0.0.1 for security', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const fullConfig = buildXrayJsonConfig([vless]);
    assert.equal(fullConfig.inbounds[0].listen, '127.0.0.1');
  });
});

describe('AmneziaWG Exporter', () => {
  it('should reject non-WireGuard configurations with clear message', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const res = buildAmneziaWG(vless);
    assert.ok(res.includes('only available for WireGuard'));
  });

  it('should export all peers and preserve Amnezia obfuscation headers', () => {
    const wg = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    const conf = buildAmneziaWG(wg);

    assert.ok(conf.includes('PrivateKey = aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxkMTI='));
    assert.ok(conf.includes('Jc = 7'));
    assert.ok(conf.includes('Jmin = 65'));
    assert.ok(conf.includes('Jmax = 191'));
    assert.ok(conf.includes('S1 = 15'));
    assert.ok(conf.includes('S2 = 25'));
    assert.ok(conf.includes('H1 = 123456'));
    assert.ok(conf.includes('H2 = 654321'));
    assert.ok(conf.includes('H3 = 987654'));
    assert.ok(conf.includes('H4 = 456789'));

    // Both peers
    assert.ok(conf.includes('PublicKey = cGVlcjFwdWJsaWNrZXlwZWVyMXB1YmxpY2tleXRlc3Q='));
    assert.ok(conf.includes('Endpoint = 203.0.113.10:51820'));
    assert.ok(conf.includes('PublicKey = cGVlcjJwdWJsaWNrZXlwZWVyMnB1YmxpY2tleXRlc3Q='));
    assert.ok(conf.includes('Endpoint = [2001:db8::10]:51820'));
  });
});
