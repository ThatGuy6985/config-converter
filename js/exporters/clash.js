/**
 * Clash Meta (Mihomo) Exporter with Protocol-Specific Builders
 */

import { escapeYamlString } from '../utils/escaping.js';
import { createRoutingPolicy, translateRoutingToClash } from '../routing/policy.js';

export function buildClashVless(config) {
  const p = {
    name: config.metadata.name,
    type: 'vless',
    server: config.server.address,
    port: config.server.port,
    uuid: config.authentication.uuid,
    udp: config.network?.udp ?? true
  };

  if (config.security?.type === 'tls' || config.security?.type === 'reality') {
    p.tls = true;
    p.servername = config.security.serverName || config.server.address;

    if (config.security.fingerprint) {
      p['client-fingerprint'] = config.security.fingerprint;
    }

    if (config.security.alpn?.length > 0) {
      p.alpn = config.security.alpn;
    }

    if (config.security.type === 'reality') {
      p['reality-opts'] = {};
      if (config.security.publicKey) {
        p['reality-opts']['public-key'] = config.security.publicKey;
      }
      if (config.security.shortId) {
        p['reality-opts']['short-id'] = config.security.shortId;
      }
    }
  }

  if (config.security?.flow) {
    p.flow = config.security.flow;
  }

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    p.network = 'ws';
    p['ws-opts'] = {
      path: config.transport.path || '/'
    };
    if (config.transport.host) {
      p['ws-opts'].headers = {
        Host: config.transport.host
      };
    }
  } else if (transportType === 'grpc') {
    p.network = 'grpc';
    p['grpc-opts'] = {
      'grpc-service-name': config.transport.serviceName || config.transport.path || ''
    };
  } else if (transportType === 'http' || transportType === 'h2') {
    p.network = 'h2';
    p['h2-opts'] = {
      host: [config.transport.host || config.server.address],
      path: config.transport.path || '/'
    };
  }

  return p;
}

export function buildClashVmess(config) {
  const p = {
    name: config.metadata.name,
    type: 'vmess',
    server: config.server.address,
    port: config.server.port,
    uuid: config.authentication.uuid,
    alterId: config.authentication.alterId ?? 0,
    cipher: config.authentication.cipher || 'auto',
    udp: config.network?.udp ?? true
  };

  if (config.security?.type === 'tls') {
    p.tls = true;
    p.servername = config.security.serverName || config.server.address;
    if (config.security.alpn?.length > 0) p.alpn = config.security.alpn;
    if (config.security.fingerprint) p['client-fingerprint'] = config.security.fingerprint;
  }

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    p.network = 'ws';
    p['ws-opts'] = {
      path: config.transport.path || '/'
    };
    if (config.transport.host) {
      p['ws-opts'].headers = { Host: config.transport.host };
    }
  } else if (transportType === 'grpc') {
    p.network = 'grpc';
    p['grpc-opts'] = {
      'grpc-service-name': config.transport.serviceName || config.transport.path || ''
    };
  }

  return p;
}

export function buildClashTrojan(config) {
  const p = {
    name: config.metadata.name,
    type: 'trojan',
    server: config.server.address,
    port: config.server.port,
    // CRITICAL: Trojan uses 'password', NEVER 'uuid'
    password: config.authentication.password,
    udp: config.network?.udp ?? true
  };

  p.sni = config.security?.serverName || config.server.address;
  if (config.security?.alpn?.length > 0) p.alpn = config.security.alpn;
  if (config.security?.fingerprint) p['client-fingerprint'] = config.security.fingerprint;

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    p.network = 'ws';
    p['ws-opts'] = {
      path: config.transport.path || '/'
    };
    if (config.transport.host) {
      p['ws-opts'].headers = { Host: config.transport.host };
    }
  } else if (transportType === 'grpc') {
    p.network = 'grpc';
    p['grpc-opts'] = {
      'grpc-service-name': config.transport.serviceName || config.transport.path || ''
    };
  }

  return p;
}

export function buildClashWireguard(config, globalSettings = {}) {
  const primaryPeer = config.peers?.[0] || {};
  const ip = config.interface?.addresses?.[0] || '172.16.0.2/32';

  const p = {
    name: config.metadata.name,
    type: 'wireguard',
    server: primaryPeer.endpoint?.host || '127.0.0.1',
    port: primaryPeer.endpoint?.port || 51820,
    'private-key': config.interface?.privateKey || '',
    'public-key': primaryPeer.publicKey || '',
    ip: ip.includes('/') ? ip : `${ip}/32`,
    'ip-version': 'ipv4',
    mtu: config.interface?.mtu || globalSettings.mtu || 1280,
    udp: true,
    'persistent-keepalive': primaryPeer.persistentKeepalive || globalSettings.keepalive || 25,
    'allowed-ips': primaryPeer.allowedIPs?.length > 0 ? primaryPeer.allowedIPs : ['0.0.0.0/0', '::/0'],
    'remote-dns-resolve': true
  };

  if (primaryPeer.presharedKey) {
    p['preshared-key'] = primaryPeer.presharedKey;
  }

  // Preserve reserved bytes for Warp / Mihomo if present
  if (config.amnezia && (config.amnezia.s1 || config.amnezia.s2 || config.amnezia.s3)) {
    p.reserved = [config.amnezia.s1, config.amnezia.s2, config.amnezia.s3];
  }

  return p;
}

/**
 * Builds complete Clash Meta YAML document
 */
export function buildClashConfig(configs, settings = {}) {
  if (!Array.isArray(configs) || configs.length === 0) return '# No configuration available\n';

  const firstName = configs[0].metadata?.name || 'Proxy-1';
  const dnsHost = settings.dns || configs[0].interface?.dns?.[0] || '1.1.1.1';
  const mtuVal = settings.mtu || configs[0].interface?.mtu || 1280;
  const allowLan = settings.allowLan ?? false;

  const proxies = configs.map(c => {
    switch (c.protocol) {
      case 'vless': return buildClashVless(c);
      case 'vmess': return buildClashVmess(c);
      case 'trojan': return buildClashTrojan(c);
      case 'wireguard': return buildClashWireguard(c, settings);
      default: return null;
    }
  }).filter(Boolean);

  const policy = createRoutingPolicy({
    irBypass: settings.irBypass ?? true,
    proxyTag: 'Selector'
  });
  const rules = translateRoutingToClash(policy);

  let yaml = `mixed-port: 7890
ipv6: true
allow-lan: ${allowLan}
unified-delay: false
log-level: warning
mode: rule

dns:
  enable: true
  respect-rules: true
  use-system-hosts: false
  ipv6: false
  enhanced-mode: redir-host
  nameserver:
    - 10.2.0.1#${escapeYamlString(firstName)}
    - ${dnsHost}#${escapeYamlString(firstName)}
  proxy-server-nameserver:
    - 8.8.8.8#DIRECT
  direct-nameserver:
    - 8.8.8.8#DIRECT

tun:
  enable: true
  stack: mixed
  auto-route: true
  strict-route: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
    - tcp://any:53
  mtu: ${mtuVal}

proxies:
`;

  proxies.forEach(p => {
    yaml += `  - name: ${escapeYamlString(p.name)}\n`;
    yaml += `    type: ${p.type}\n`;
    yaml += `    server: ${escapeYamlString(p.server)}\n`;
    yaml += `    port: ${p.port}\n`;

    if (p.uuid) yaml += `    uuid: ${escapeYamlString(p.uuid)}\n`;
    if (p.password) yaml += `    password: ${escapeYamlString(p.password)}\n`;
    if (p.alterId !== undefined) yaml += `    alterId: ${p.alterId}\n`;
    if (p.cipher) yaml += `    cipher: ${escapeYamlString(p.cipher)}\n`;
    if (p['private-key']) yaml += `    private-key: ${escapeYamlString(p['private-key'])}\n`;
    if (p['public-key']) yaml += `    public-key: ${escapeYamlString(p['public-key'])}\n`;
    if (p['preshared-key']) yaml += `    preshared-key: ${escapeYamlString(p['preshared-key'])}\n`;
    if (p.ip) yaml += `    ip: ${escapeYamlString(p.ip)}\n`;
    if (p['ip-version']) yaml += `    ip-version: ${p['ip-version']}\n`;
    if (p.reserved) yaml += `    reserved: [${p.reserved.join(', ')}]\n`;
    if (p.mtu) yaml += `    mtu: ${p.mtu}\n`;
    if (p.udp !== undefined) yaml += `    udp: ${p.udp}\n`;
    if (p['persistent-keepalive']) yaml += `    persistent-keepalive: ${p['persistent-keepalive']}\n`;
    if (p['remote-dns-resolve'] !== undefined) yaml += `    remote-dns-resolve: ${p['remote-dns-resolve']}\n`;

    if (p['allowed-ips']) {
      yaml += `    allowed-ips:\n`;
      p['allowed-ips'].forEach(a => { yaml += `      - ${escapeYamlString(a)}\n`; });
    }

    if (p.tls) {
      yaml += `    tls: true\n`;
      if (p.servername) yaml += `    servername: ${escapeYamlString(p.servername)}\n`;
      if (p.sni) yaml += `    sni: ${escapeYamlString(p.sni)}\n`;
      if (p['client-fingerprint']) yaml += `    client-fingerprint: ${escapeYamlString(p['client-fingerprint'])}\n`;
      if (p.alpn) {
        yaml += `    alpn:\n`;
        p.alpn.forEach(a => { yaml += `      - ${escapeYamlString(a)}\n`; });
      }
      if (p['reality-opts']) {
        yaml += `    reality-opts:\n`;
        if (p['reality-opts']['public-key']) yaml += `      public-key: ${escapeYamlString(p['reality-opts']['public-key'])}\n`;
        if (p['reality-opts']['short-id']) yaml += `      short-id: ${escapeYamlString(p['reality-opts']['short-id'])}\n`;
      }
    }

    if (p.flow) yaml += `    flow: ${escapeYamlString(p.flow)}\n`;
    if (p.network) yaml += `    network: ${p.network}\n`;

    if (p['ws-opts']) {
      yaml += `    ws-opts:\n`;
      yaml += `      path: ${escapeYamlString(p['ws-opts'].path)}\n`;
      if (p['ws-opts'].headers) {
        yaml += `      headers:\n`;
        for (const [k, v] of Object.entries(p['ws-opts'].headers)) {
          yaml += `        ${k}: ${escapeYamlString(v)}\n`;
        }
      }
    }

    if (p['grpc-opts']) {
      yaml += `    grpc-opts:\n`;
      yaml += `      grpc-service-name: ${escapeYamlString(p['grpc-opts']['grpc-service-name'])}\n`;
    }

    if (p['h2-opts']) {
      yaml += `    h2-opts:\n`;
      yaml += `      path: ${escapeYamlString(p['h2-opts'].path)}\n`;
      yaml += `      host:\n`;
      p['h2-opts'].host.forEach(h => { yaml += `        - ${escapeYamlString(h)}\n`; });
    }
  });

  yaml += `\nproxy-groups:\n  - name: "Selector"\n    type: select\n    proxies:\n`;
  proxies.forEach(p => { yaml += `      - ${escapeYamlString(p.name)}\n`; });
  yaml += `      - DIRECT\n\nrules:\n`;
  rules.forEach(r => { yaml += `  - ${r}\n`; });

  return yaml;
}
