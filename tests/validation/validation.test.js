import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateNormalizedModel } from '../../js/validation/model.js';
import { checkCompatibility } from '../../js/validation/compatibility.js';
import { parseVlessUri } from '../../js/parsers/vless.js';
import { parseTrojanUri } from '../../js/parsers/trojan.js';
import { parseWireguardIni } from '../../js/parsers/wireguard.js';

import {
  SAMPLE_VLESS_REALITY,
  SAMPLE_TROJAN_BASIC,
  SAMPLE_WIREGUARD_MULTI_PEER_AWG
} from '../fixtures/sample-configs.js';

describe('Model Validation', () => {
  it('should validate complete VLESS model successfully', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const res = validateNormalizedModel(vless);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  it('should fail VLESS model missing server or UUID', () => {
    const invalidVless = {
      protocol: 'vless',
      server: { address: '', port: 443 },
      authentication: { uuid: '' }
    };
    const res = validateNormalizedModel(invalidVless);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('server address')));
    assert.ok(res.errors.some(e => e.includes('client UUID')));
  });

  it('should validate Trojan model requires password and valid port', () => {
    const trojan = parseTrojanUri(SAMPLE_TROJAN_BASIC).model;
    assert.equal(validateNormalizedModel(trojan).valid, true);

    const invalidTrojan = {
      protocol: 'trojan',
      server: { address: 'trojan.com', port: 99999 },
      authentication: { password: '' }
    };
    const res = validateNormalizedModel(invalidTrojan);
    assert.equal(res.valid, false);
  });

  it('should validate WireGuard requires private key and peer with public key and endpoint', () => {
    const wg = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    assert.equal(validateNormalizedModel(wg).valid, true);

    const invalidWg = {
      protocol: 'wireguard',
      interface: { privateKey: '' },
      peers: []
    };
    const res = validateNormalizedModel(invalidWg);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('PrivateKey')));
    assert.ok(res.errors.some(e => e.includes('at least one Peer')));
  });
});

describe('Target Compatibility Validation', () => {
  it('should mark VLESS to AmneziaWG as unsupported and warn user', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const res = checkCompatibility(vless, 'amnezia');
    assert.equal(res.compatible, false);
    assert.equal(res.level, 'unsupported');
    assert.ok(res.unsupported.some(u => u.includes('AmneziaWG')));
  });

  it('should mark VLESS Reality to Clash Meta as compatible and track preserved Reality fields', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;
    const res = checkCompatibility(vless, 'clash');
    assert.equal(res.compatible, true);
    assert.ok(res.preserved.some(p => p.includes('Reality Public Key')));
    assert.ok(res.preserved.some(p => p.includes('Reality Short ID')));
  });

  it('should warn when converting AmneziaWG custom headers to standard Clash Meta WireGuard', () => {
    const wg = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    const res = checkCompatibility(wg, 'clash');
    assert.equal(res.compatible, true);
    assert.equal(res.level, 'partial');
    assert.ok(res.warnings.some(w => w.includes('AWG obfuscation parameters')));
    assert.ok(res.unsupported.some(u => u.includes('AWG Jc/Jmin/Jmax')));
  });

  it('should report exact compatibility for WireGuard to AmneziaWG', () => {
    const wg = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    const res = checkCompatibility(wg, 'amnezia');
    assert.equal(res.compatible, true);
    assert.equal(res.level, 'exact');
    assert.ok(res.preserved.some(p => p.includes('Amnezia Jc/Jmin/Jmax')));
    assert.ok(res.preserved.some(p => p.includes('All 2 WireGuard Peers')));
  });
});
