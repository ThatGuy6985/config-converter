import { createRoutingPolicy, translateRoutingToSingBox } from '../routing/policy.js';

export function buildSingBoxVless(config) {
  const outbound = {
    type: 'vless',
    tag: config.metadata.name,
    server: config.server.address,
    server_port: config.server.port,
    uuid: config.authentication.uuid
  };

  if (config.security?.flow) {
    outbound.flow = config.security.flow;
  }

  if (config.security?.type === 'tls' || config.security?.type === 'reality') {
    outbound.tls = {
      enabled: true,
      server_name: config.security.serverName || config.server.address
    };

    if (config.security.alpn?.length > 0) {
      outbound.tls.alpn = config.security.alpn;
    }

    if (config.security.fingerprint) {
      outbound.tls.utls = {
        enabled: true,
        fingerprint: config.security.fingerprint
      };
    }

    if (config.security.type === 'reality') {
      outbound.tls.reality = {
        enabled: true,
        public_key: config.security.publicKey || '',
        short_id: config.security.shortId || ''
      };
    }
  }

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    outbound.transport = {
      type: 'ws',
      path: config.transport.path || '/',
      headers: config.transport.headers || (config.transport.host ? { Host: config.transport.host } : undefined)
    };
  } else if (transportType === 'grpc') {
    outbound.transport = {
      type: 'grpc',
      service_name: config.transport.serviceName || config.transport.path || ''
    };
  } else if (transportType === 'http' || transportType === 'h2') {
    outbound.transport = {
      type: 'http',
      path: config.transport.path || '/',
      host: config.transport.host ? [config.transport.host] : undefined
    };
  }

  return outbound;
}

export function buildSingBoxVmess(config) {
  const outbound = {
    type: 'vmess',
    tag: config.metadata.name,
    server: config.server.address,
    server_port: config.server.port,
    uuid: config.authentication.uuid,
    security: config.authentication.cipher || 'auto',
    alter_id: config.authentication.alterId ?? 0
  };

  if (config.security?.type === 'tls') {
    outbound.tls = {
      enabled: true,
      server_name: config.security.serverName || config.server.address
    };
    if (config.security.alpn?.length > 0) outbound.tls.alpn = config.security.alpn;
    if (config.security.fingerprint) {
      outbound.tls.utls = { enabled: true, fingerprint: config.security.fingerprint };
    }
  }

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    outbound.transport = {
      type: 'ws',
      path: config.transport.path || '/',
      headers: config.transport.headers || (config.transport.host ? { Host: config.transport.host } : undefined)
    };
  } else if (transportType === 'grpc') {
    outbound.transport = {
      type: 'grpc',
      service_name: config.transport.serviceName || config.transport.path || ''
    };
  }

  return outbound;
}

export function buildSingBoxTrojan(config) {
  const outbound = {
    type: 'trojan',
    tag: config.metadata.name,
    server: config.server.address,
    server_port: config.server.port,

    password: config.authentication.password
  };

  outbound.tls = {
    enabled: true,
    server_name: config.security?.serverName || config.server.address
  };
  if (config.security?.alpn?.length > 0) outbound.tls.alpn = config.security.alpn;
  if (config.security?.fingerprint) {
    outbound.tls.utls = { enabled: true, fingerprint: config.security.fingerprint };
  }

  const transportType = config.transport?.type;
  if (transportType === 'ws' || transportType === 'websocket') {
    outbound.transport = {
      type: 'ws',
      path: config.transport.path || '/',
      headers: config.transport.headers || (config.transport.host ? { Host: config.transport.host } : undefined)
    };
  } else if (transportType === 'grpc') {
    outbound.transport = {
      type: 'grpc',
      service_name: config.transport.serviceName || config.transport.path || ''
    };
  }

  return outbound;
}

export function buildSingBoxWireguard(config, settings = {}) {
  const primaryPeer = config.peers?.[0] || {};
  const addresses = config.interface?.addresses?.length > 0
    ? config.interface.addresses
    : ['172.16.0.2/32'];

  const outbound = {
    type: 'wireguard',
    tag: config.metadata.name,
    server: primaryPeer.endpoint?.host || '127.0.0.1',
    server_port: primaryPeer.endpoint?.port || 51820,
    local_address: addresses,
    private_key: config.interface?.privateKey || '',
    peer_public_key: primaryPeer.publicKey || '',
    mtu: config.interface?.mtu || settings.mtu || 1280
  };

  if (primaryPeer.presharedKey) {
    outbound.pre_shared_key = primaryPeer.presharedKey;
  }

  if (config.amnezia && (config.amnezia.s1 || config.amnezia.s2 || config.amnezia.s3)) {
    outbound.reserved = [config.amnezia.s1, config.amnezia.s2, config.amnezia.s3];
  }

  return outbound;
}

export function buildSingBoxConfig(configs, settings = {}) {
  if (!Array.isArray(configs) || configs.length === 0) return {};

  const dnsHost = settings.dns || configs[0].interface?.dns?.[0] || '1.1.1.1';
  const listenHost = settings.allowLan ? '0.0.0.0' : '127.0.0.1';

  const outbounds = configs.map(c => {
    switch (c.protocol) {
      case 'vless': return buildSingBoxVless(c);
      case 'vmess': return buildSingBoxVmess(c);
      case 'trojan': return buildSingBoxTrojan(c);
      case 'wireguard': return buildSingBoxWireguard(c, settings);
      default: return null;
    }
  }).filter(Boolean);

  outbounds.push({ type: 'direct', tag: 'direct' });
  outbounds.push({ type: 'block', tag: 'block' });

  const policy = createRoutingPolicy({
    irBypass: settings.irBypass ?? true,
    proxyTag: outbounds[0]?.tag || 'proxy'
  });
  const routeRules = translateRoutingToSingBox(policy);

  return {
    log: { level: 'info' },
    dns: {
      servers: [
        { tag: 'dns-remote', address: dnsHost }
      ]
    },
    inbounds: [
      {
        type: 'mixed',
        tag: 'mixed-in',
        listen: listenHost,
        listen_port: 10808
      }
    ],
    outbounds,
    route: { rules: routeRules }
  };
}
