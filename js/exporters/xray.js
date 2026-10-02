/**
 * Xray Core Exporter with Protocol-Specific Outbound Builders
 */

import { createRoutingPolicy, translateRoutingToXray } from '../routing/policy.js';

export function buildXrayVless(config) {
  const user = {
    id: config.authentication.uuid,
    encryption: 'none'
  };
  if (config.security?.flow) {
    user.flow = config.security.flow;
  }

  const outbound = {
    protocol: 'vless',
    tag: config.metadata.name,
    settings: {
      vnext: [
        {
          address: config.server.address,
          port: config.server.port,
          users: [user]
        }
      ]
    },
    streamSettings: {}
  };

  const transportType = config.transport?.type || 'tcp';
  outbound.streamSettings.network = ['websocket', 'ws'].includes(transportType) ? 'ws' : (transportType === 'grpc' ? 'grpc' : 'tcp');

  if (config.security?.type === 'reality') {
    outbound.streamSettings.security = 'reality';
    outbound.streamSettings.realitySettings = {
      serverName: config.security.serverName || config.server.address,
      fingerprint: config.security.fingerprint || 'chrome',
      show: false,
      publicKey: config.security.publicKey || '',
      shortId: config.security.shortId || '',
      spiderX: ''
    };
  } else if (config.security?.type === 'tls') {
    outbound.streamSettings.security = 'tls';
    outbound.streamSettings.tlsSettings = {
      serverName: config.security.serverName || config.server.address,
      fingerprint: config.security.fingerprint || 'chrome',
      allowInsecure: false
    };
    if (config.security.alpn?.length > 0) {
      outbound.streamSettings.tlsSettings.alpn = config.security.alpn;
    }
  }

  if (outbound.streamSettings.network === 'ws') {
    outbound.streamSettings.wsSettings = {
      path: config.transport?.path || '/',
      headers: config.transport?.headers || (config.transport?.host ? { Host: config.transport.host } : {})
    };
  } else if (outbound.streamSettings.network === 'grpc') {
    outbound.streamSettings.grpcSettings = {
      serviceName: config.transport?.serviceName || config.transport?.path || '',
      multiMode: true
    };
  }

  return outbound;
}

export function buildXrayVmess(config) {
  const outbound = {
    protocol: 'vmess',
    tag: config.metadata.name,
    settings: {
      vnext: [
        {
          address: config.server.address,
          port: config.server.port,
          users: [
            {
              id: config.authentication.uuid,
              alterId: config.authentication.alterId ?? 0,
              security: config.authentication.cipher || 'auto'
            }
          ]
        }
      ]
    },
    streamSettings: {}
  };

  const transportType = config.transport?.type || 'tcp';
  outbound.streamSettings.network = ['websocket', 'ws'].includes(transportType) ? 'ws' : (transportType === 'grpc' ? 'grpc' : 'tcp');

  if (config.security?.type === 'tls') {
    outbound.streamSettings.security = 'tls';
    outbound.streamSettings.tlsSettings = {
      serverName: config.security.serverName || config.server.address,
      fingerprint: config.security.fingerprint || 'chrome',
      allowInsecure: false
    };
    if (config.security.alpn?.length > 0) {
      outbound.streamSettings.tlsSettings.alpn = config.security.alpn;
    }
  }

  if (outbound.streamSettings.network === 'ws') {
    outbound.streamSettings.wsSettings = {
      path: config.transport?.path || '/',
      headers: config.transport?.headers || (config.transport?.host ? { Host: config.transport.host } : {})
    };
  } else if (outbound.streamSettings.network === 'grpc') {
    outbound.streamSettings.grpcSettings = {
      serviceName: config.transport?.serviceName || config.transport?.path || '',
      multiMode: true
    };
  }

  return outbound;
}

export function buildXrayTrojan(config) {
  // CRITICAL FIX: Xray Trojan outbound uses `servers`, NOT `vnext`!
  const outbound = {
    protocol: 'trojan',
    tag: config.metadata.name,
    settings: {
      servers: [
        {
          address: config.server.address,
          port: config.server.port,
          password: config.authentication.password
        }
      ]
    },
    streamSettings: {
      security: 'tls',
      tlsSettings: {
        serverName: config.security?.serverName || config.server.address,
        fingerprint: config.security?.fingerprint || 'chrome',
        allowInsecure: false
      }
    }
  };

  if (config.security?.alpn?.length > 0) {
    outbound.streamSettings.tlsSettings.alpn = config.security.alpn;
  }

  const transportType = config.transport?.type || 'tcp';
  outbound.streamSettings.network = ['websocket', 'ws'].includes(transportType) ? 'ws' : (transportType === 'grpc' ? 'grpc' : 'tcp');

  if (outbound.streamSettings.network === 'ws') {
    outbound.streamSettings.wsSettings = {
      path: config.transport?.path || '/',
      headers: config.transport?.headers || (config.transport?.host ? { Host: config.transport.host } : {})
    };
  } else if (outbound.streamSettings.network === 'grpc') {
    outbound.streamSettings.grpcSettings = {
      serviceName: config.transport?.serviceName || config.transport?.path || '',
      multiMode: true
    };
  }

  return outbound;
}

export function buildXrayWireguard(config, settings = {}) {
  const peers = (config.peers || []).map(p => {
    const peerObj = {
      endpoint: `${p.endpoint.host}:${p.endpoint.port}`,
      publicKey: p.publicKey,
      keepAlive: p.persistentKeepalive || settings.keepalive || 25,
      allowedIPs: p.allowedIPs?.length > 0 ? p.allowedIPs : ['0.0.0.0/0', '::/0']
    };
    if (p.presharedKey) {
      peerObj.preSharedKey = p.presharedKey;
    }
    return peerObj;
  });

  const outbound = {
    protocol: 'wireguard',
    tag: config.metadata.name,
    settings: {
      secretKey: config.interface?.privateKey || '',
      address: config.interface?.addresses?.length > 0 ? config.interface.addresses : ['172.16.0.2/32'],
      mtu: config.interface?.mtu || settings.mtu || 1280,
      peers: peers.length > 0 ? peers : [
        {
          endpoint: '127.0.0.1:51820',
          publicKey: '',
          keepAlive: 25,
          allowedIPs: ['0.0.0.0/0', '::/0']
        }
      ]
    }
  };

  if (settings.useNoise || settings.useFragment) {
    outbound.streamSettings = {};
    if (settings.useNoise) {
      const jcCount = config.amnezia?.jc || settings.awg?.jc || 5;
      const jmin = config.amnezia?.jmin || settings.awg?.jmin || 50;
      const jmax = config.amnezia?.jmax || settings.awg?.jmax || 100;
      const noiseList = [];

      for (let i = 0; i < jcCount; i++) {
        noiseList.push({
          rand: `${jmin}-${jmax}`,
          randRange: '0-255',
          delay: '1-5'
        });
      }

      outbound.streamSettings.finalmask = {
        udp: [
          {
            type: 'noise',
            settings: {
              reset: '30-60',
              noise: noiseList
            }
          }
        ]
      };
    }

    if (settings.useFragment) {
      outbound.streamSettings.sockopt = {
        dialerProxy: 'fragment',
        tcpKeepAliveInterval: 15
      };
    }
  }

  return outbound;
}

export function buildXrayJsonConfig(configs, settings = {}) {
  if (!Array.isArray(configs) || configs.length === 0) return {};

  const firstEntry = configs[0];
  const remarks = firstEntry.metadata?.name || 'Proxy-1';
  const dnsHost = settings.dns || firstEntry.interface?.dns?.[0] || '1.1.1.1';
  const listenHost = settings.allowLan ? '0.0.0.0' : '127.0.0.1';

  const dnsServers = [
    { address: dnsHost, tag: 'remote-dns' }
  ];

  if (settings.irBypass ?? true) {
    dnsServers.push({
      address: dnsHost,
      domains: ['geosite:category-ir', 'regexp:.*\\.ir$'],
      expectIPs: ['geoip:ir'],
      skipFallback: true
    });
  }

  const outbounds = configs.map(c => {
    switch (c.protocol) {
      case 'vless': return buildXrayVless(c);
      case 'vmess': return buildXrayVmess(c);
      case 'trojan': return buildXrayTrojan(c);
      case 'wireguard': return buildXrayWireguard(c, settings);
      default: return null;
    }
  }).filter(Boolean);

  outbounds.push({ protocol: 'freedom', tag: 'direct' });
  outbounds.push({ protocol: 'blackhole', tag: 'block' });

  const policy = createRoutingPolicy({
    irBypass: settings.irBypass ?? true,
    proxyTag: remarks
  });
  const routingRules = translateRoutingToXray(policy);

  return {
    remarks,
    log: { loglevel: 'warning' },
    dns: {
      servers: dnsServers,
      queryStrategy: 'UseIP'
    },
    inbounds: [
      {
        listen: listenHost,
        port: 10808,
        protocol: 'mixed',
        settings: { auth: 'noauth', udp: true },
        sniffing: {
          destOverride: ['http', 'tls'],
          enabled: true,
          routeOnly: true
        },
        tag: 'mixed-in'
      }
    ],
    outbounds,
    routing: {
      domainStrategy: 'IPIfNonMatch',
      rules: routingRules
    }
  };
}
