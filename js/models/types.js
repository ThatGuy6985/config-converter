export function createVlessModel(data = {}) {
  return {
    protocol: 'vless',
    metadata: {
      name: data.metadata?.name || 'VLESS-Proxy',
      source: data.metadata?.source || 'uri',
      id: data.metadata?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2))
    },
    server: {
      address: data.server?.address || '',
      port: Number(data.server?.port) || 443
    },
    authentication: {
      uuid: data.authentication?.uuid || '',

      password: null
    },
    transport: {
      type: (data.transport?.type || 'tcp').toLowerCase(), 
      path: data.transport?.path || null,
      host: data.transport?.host || null,
      serviceName: data.transport?.serviceName || null,
      headers: data.transport?.headers || {}
    },
    security: {
      type: (data.security?.type || 'none').toLowerCase(), 
      serverName: data.security?.serverName || null,
      alpn: Array.isArray(data.security?.alpn) ? data.security.alpn : (data.security?.alpn ? [data.security.alpn] : []),
      fingerprint: data.security?.fingerprint || null,
      publicKey: data.security?.publicKey || null, 
      shortId: data.security?.shortId || null,     
      flow: data.security?.flow || null            
    },
    network: {
      udp: data.network?.udp ?? true
    },
    original: {
      raw: data.original?.raw || '',
      type: data.original?.type || 'vless-uri'
    }
  };
}

export function createTrojanModel(data = {}) {
  return {
    protocol: 'trojan',
    metadata: {
      name: data.metadata?.name || 'Trojan-Proxy',
      source: data.metadata?.source || 'uri',
      id: data.metadata?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2))
    },
    server: {
      address: data.server?.address || '',
      port: Number(data.server?.port) || 443
    },
    authentication: {

      password: data.authentication?.password || '',
      uuid: null
    },
    transport: {
      type: (data.transport?.type || 'tcp').toLowerCase(), 
      path: data.transport?.path || null,
      host: data.transport?.host || null,
      serviceName: data.transport?.serviceName || null,
      headers: data.transport?.headers || {}
    },
    security: {
      type: (data.security?.type || 'tls').toLowerCase(), 
      serverName: data.security?.serverName || null,
      alpn: Array.isArray(data.security?.alpn) ? data.security.alpn : (data.security?.alpn ? [data.security.alpn] : []),
      fingerprint: data.security?.fingerprint || null
    },
    network: {
      udp: data.network?.udp ?? true
    },
    original: {
      raw: data.original?.raw || '',
      type: data.original?.type || 'trojan-uri'
    }
  };
}

export function createVmessModel(data = {}) {
  return {
    protocol: 'vmess',
    metadata: {
      name: data.metadata?.name || 'VMess-Proxy',
      source: data.metadata?.source || 'uri',
      id: data.metadata?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2))
    },
    server: {
      address: data.server?.address || '',
      port: Number(data.server?.port) || 443
    },
    authentication: {
      uuid: data.authentication?.uuid || '',
      alterId: Number(data.authentication?.alterId) || 0,
      cipher: data.authentication?.cipher || 'auto',
      password: null
    },
    transport: {
      type: (data.transport?.type || 'tcp').toLowerCase(), 
      path: data.transport?.path || null,
      host: data.transport?.host || null,
      serviceName: data.transport?.serviceName || null,
      headers: data.transport?.headers || {}
    },
    security: {
      type: (data.security?.type || 'none').toLowerCase(), 
      serverName: data.security?.serverName || null,
      alpn: Array.isArray(data.security?.alpn) ? data.security.alpn : (data.security?.alpn ? [data.security.alpn] : []),
      fingerprint: data.security?.fingerprint || null
    },
    network: {
      udp: data.network?.udp ?? true
    },
    original: {
      raw: data.original?.raw || '',
      type: data.original?.type || 'vmess-uri'
    }
  };
}

export function createWireguardModel(data = {}) {
  const defaultPeers = Array.isArray(data.peers) && data.peers.length > 0
    ? data.peers.map(p => ({
        publicKey: p.publicKey || '',
        endpoint: {
          host: p.endpoint?.host || '',
          port: Number(p.endpoint?.port) || 51820
        },
        allowedIPs: Array.isArray(p.allowedIPs) && p.allowedIPs.length > 0 ? p.allowedIPs : ['0.0.0.0/0', '::/0'],
        persistentKeepalive: Number(p.persistentKeepalive) || 25,
        presharedKey: p.presharedKey || null
      }))
    : [
        {
          publicKey: data.peer?.publicKey || '',
          endpoint: {
            host: data.peer?.endpoint?.host || '',
            port: Number(data.peer?.endpoint?.port) || 51820
          },
          allowedIPs: Array.isArray(data.peer?.allowedIPs) && data.peer.allowedIPs.length > 0 ? data.peer.allowedIPs : ['0.0.0.0/0', '::/0'],
          persistentKeepalive: Number(data.peer?.persistentKeepalive) || 25,
          presharedKey: data.peer?.presharedKey || null
        }
      ];

  const addresses = Array.isArray(data.interface?.addresses) && data.interface.addresses.length > 0
    ? data.interface.addresses
    : ['172.16.0.2/32'];

  const dns = Array.isArray(data.interface?.dns) && data.interface.dns.length > 0
    ? data.interface.dns
    : ['1.1.1.1'];

  return {
    protocol: 'wireguard',
    metadata: {
      name: data.metadata?.name || 'WireGuard-Tunnel',
      source: data.metadata?.source || 'ini',
      id: data.metadata?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2))
    },
    interface: {
      privateKey: data.interface?.privateKey || '',
      addresses,
      dns,
      mtu: Number(data.interface?.mtu) || 1280
    },
    peers: defaultPeers,
    amnezia: {
      jc: Number(data.amnezia?.jc ?? 5),
      jmin: Number(data.amnezia?.jmin ?? 50),
      jmax: Number(data.amnezia?.jmax ?? 100),
      s1: Number(data.amnezia?.s1 ?? 0),
      s2: Number(data.amnezia?.s2 ?? 0),
      s3: Number(data.amnezia?.s3 ?? 0),
      s4: Number(data.amnezia?.s4 ?? 0),
      h1: Number(data.amnezia?.h1 ?? 1),
      h2: Number(data.amnezia?.h2 ?? 2),
      h3: Number(data.amnezia?.h3 ?? 3),
      h4: Number(data.amnezia?.h4 ?? 4),
      i1: data.amnezia?.i1 || '',
      i2: data.amnezia?.i2 || ''
    },
    original: {
      raw: data.original?.raw || '',
      type: data.original?.type || 'wireguard-ini'
    }
  };
}
