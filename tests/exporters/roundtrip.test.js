import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseVlessUri } from '../../js/parsers/vless.js';
import { parseTrojanUri } from '../../js/parsers/trojan.js';
import { parseVmessUri } from '../../js/parsers/vmess.js';
import { parseWireguardIni } from '../../js/parsers/wireguard.js';

import { buildClashConfig } from '../../js/exporters/clash.js';
import { buildSingBoxConfig } from '../../js/exporters/singbox.js';
import { buildXrayJsonConfig } from '../../js/exporters/xray.js';
import { buildAmneziaWG } from '../../js/exporters/amnezia.js';

import {
  SAMPLE_VLESS_REALITY,
  SAMPLE_VLESS_WS,
  SAMPLE_TROJAN_BASIC,
  SAMPLE_VMESS_BASE64,
  SAMPLE_WIREGUARD_MULTI_PEER_AWG
} from '../fixtures/sample-configs.js';

describe('Round-Trip & Field Preservation Checks', () => {
  it('VLESS Reality: normalized model preserves all Reality tokens across Sing-Box and Xray', () => {
    const vless = parseVlessUri(SAMPLE_VLESS_REALITY).model;

    const sbConfig = buildSingBoxConfig([vless]);
    const sbOutbound = sbConfig.outbounds.find(o => o.type === 'vless');
    assert.equal(sbOutbound.server, vless.server.address);
    assert.equal(sbOutbound.server_port, vless.server.port);
    assert.equal(sbOutbound.uuid, vless.authentication.uuid);
    assert.equal(sbOutbound.tls.reality.public_key, vless.security.publicKey);
    assert.equal(sbOutbound.tls.reality.short_id, vless.security.shortId);
    assert.equal(sbOutbound.tls.utls.fingerprint, vless.security.fingerprint);

    const xrayConfig = buildXrayJsonConfig([vless]);
    const xrayOutbound = xrayConfig.outbounds.find(o => o.protocol === 'vless');
    assert.equal(xrayOutbound.settings.vnext[0].address, vless.server.address);
    assert.equal(xrayOutbound.settings.vnext[0].port, vless.server.port);
    assert.equal(xrayOutbound.settings.vnext[0].users[0].id, vless.authentication.uuid);
    assert.equal(xrayOutbound.streamSettings.realitySettings.publicKey, vless.security.publicKey);
    assert.equal(xrayOutbound.streamSettings.realitySettings.shortId, vless.security.shortId);
    assert.equal(xrayOutbound.streamSettings.realitySettings.fingerprint, vless.security.fingerprint);
  });

  it('WireGuard Amnezia: INI -> parse -> export -> re-parse preserves all parameters', () => {
    const initialParsed = parseWireguardIni(SAMPLE_WIREGUARD_MULTI_PEER_AWG).model;
    const exportedConf = buildAmneziaWG(initialParsed);

    const reParsed = parseWireguardIni(exportedConf).model;
    assert.equal(reParsed.interface.privateKey, initialParsed.interface.privateKey);
    assert.equal(reParsed.interface.mtu, initialParsed.interface.mtu);
    assert.equal(reParsed.amnezia.jc, initialParsed.amnezia.jc);
    assert.equal(reParsed.amnezia.jmin, initialParsed.amnezia.jmin);
    assert.equal(reParsed.amnezia.jmax, initialParsed.amnezia.jmax);
    assert.equal(reParsed.amnezia.s1, initialParsed.amnezia.s1);
    assert.equal(reParsed.amnezia.s2, initialParsed.amnezia.s2);
    assert.equal(reParsed.amnezia.h1, initialParsed.amnezia.h1);
    assert.equal(reParsed.amnezia.h2, initialParsed.amnezia.h2);
    assert.equal(reParsed.amnezia.h3, initialParsed.amnezia.h3);
    assert.equal(reParsed.amnezia.h4, initialParsed.amnezia.h4);

    assert.equal(reParsed.peers.length, initialParsed.peers.length);
    assert.equal(reParsed.peers[0].publicKey, initialParsed.peers[0].publicKey);
    assert.equal(reParsed.peers[0].endpoint.host, initialParsed.peers[0].endpoint.host);
    assert.equal(reParsed.peers[1].publicKey, initialParsed.peers[1].publicKey);
    assert.equal(reParsed.peers[1].endpoint.host, initialParsed.peers[1].endpoint.host);
  });
});
