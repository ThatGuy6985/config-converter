/**
 * Target Compatibility and Field Preservation Analysis
 * Never silently discard fields without warning the user.
 */

export function checkCompatibility(config, target) {
  if (!config || !config.protocol) {
    return {
      compatible: false,
      level: 'unsupported',
      preserved: [],
      unsupported: ['Invalid or empty configuration model'],
      warnings: ['Cannot analyze compatibility without a valid model']
    };
  }

  const proto = config.protocol;
  const targetLower = (target || '').toLowerCase();

  const preserved = [];
  const unsupported = [];
  const warnings = [];

  // ==================== AMNEZIAWG TARGET ====================
  if (targetLower === 'amnezia') {
    if (proto !== 'wireguard') {
      return {
        compatible: false,
        level: 'unsupported',
        preserved: [],
        unsupported: [`Protocol '${proto.toUpperCase()}' cannot be converted to AmneziaWG (AmneziaWG only supports WireGuard tunnels).`],
        warnings: [`Please select Clash Meta, Sing-Box, or Xray JSON to export this ${proto.toUpperCase()} proxy.`]
      };
    }

    preserved.push('Interface PrivateKey', 'Interface Addresses', 'Remote DNS', 'MTU');
    preserved.push('Peer PublicKey', 'Endpoint (Host & Port)', 'AllowedIPs', 'PersistentKeepalive');
    if (config.peers?.[0]?.presharedKey) preserved.push('PresharedKey');
    preserved.push('Amnezia Jc/Jmin/Jmax', 'Amnezia S1-S4 Junk Offsets', 'Amnezia H1-H4 Magic Headers');
    if (config.amnezia?.i1 || config.amnezia?.i2) preserved.push('Amnezia Init Payloads (I1, I2)');
    if (config.peers?.length > 1) preserved.push(`All ${config.peers.length} WireGuard Peers`);

    return {
      compatible: true,
      level: 'exact',
      preserved,
      unsupported,
      warnings
    };
  }

  // ==================== CLASH META TARGET ====================
  if (targetLower === 'clash') {
    if (proto === 'vless') {
      preserved.push('Server Address', 'Port', 'Client UUID', 'UDP Support');
      if (config.security?.type === 'tls') {
        preserved.push('TLS Enabled', 'Server Name (SNI)', 'ALPN');
      } else if (config.security?.type === 'reality') {
        preserved.push('TLS / Reality Enabled', 'Server Name (SNI)');
        if (config.security.publicKey) preserved.push('Reality Public Key (pbk)');
        if (config.security.shortId) preserved.push('Reality Short ID (sid)');
        if (config.security.fingerprint) preserved.push('Client Fingerprint (fp)');
      }
      if (config.security?.flow) preserved.push(`Flow (${config.security.flow})`);

      if (['ws', 'websocket'].includes(config.transport?.type)) {
        preserved.push('WebSocket Transport (ws-opts: path, headers)');
      } else if (config.transport?.type === 'grpc') {
        preserved.push('gRPC Transport (grpc-opts: grpc-service-name)');
      } else if (config.transport?.type === 'http') {
        preserved.push('HTTP Transport (h2-opts)');
      }

      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'vmess') {
      preserved.push('Server Address', 'Port', 'Client UUID', 'alterId', `Cipher (${config.authentication?.cipher || 'auto'})`, 'UDP Support');
      if (config.security?.type === 'tls') preserved.push('TLS Enabled', 'Server Name (SNI)', 'ALPN');
      if (['ws', 'websocket'].includes(config.transport?.type)) preserved.push('WebSocket Transport');
      if (config.transport?.type === 'grpc') preserved.push('gRPC Transport');

      return {
        compatible: true,
        level: 'compatible',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'trojan') {
      preserved.push('Server Address', 'Port', 'Password Authentication', 'TLS Enabled', 'SNI', 'UDP Support');
      if (config.security?.alpn?.length) preserved.push('ALPN');
      if (config.transport?.type === 'ws') preserved.push('WebSocket Transport');
      if (config.transport?.type === 'grpc') preserved.push('gRPC Transport');

      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'wireguard') {
      preserved.push('Server Address', 'Port', 'Interface PrivateKey', 'Peer PublicKey', 'IP Address', 'AllowedIPs', 'PersistentKeepalive', 'MTU');
      if (config.peers?.[0]?.presharedKey) preserved.push('PresharedKey');

      // Amnezia check
      const hasAwg = config.amnezia && (config.amnezia.s1 || config.amnezia.s2 || config.amnezia.jc !== 5);
      if (hasAwg) {
        warnings.push('AWG obfuscation parameters (Jc, S1-S4, H1-H4) cannot be represented in standard Clash Meta WireGuard. Converted as standard WireGuard (reserved bytes preserved where applicable).');
        unsupported.push('AWG Jc/Jmin/Jmax & H1-H4 Magic Header Masks');
      }

      if (config.peers?.length > 1) {
        warnings.push(`Configuration contains ${config.peers.length} peers. Clash Meta creates a connection to the primary peer.`);
      }

      return {
        compatible: true,
        level: hasAwg ? 'partial' : 'exact',
        preserved,
        unsupported,
        warnings
      };
    }
  }

  // ==================== SING-BOX TARGET ====================
  if (targetLower === 'singbox') {
    if (proto === 'vless') {
      preserved.push('Server', 'Server Port', 'Client UUID');
      if (config.security?.flow) preserved.push(`Flow (${config.security.flow})`);
      if (config.security?.type === 'tls') {
        preserved.push('TLS (server_name, alpn)');
      } else if (config.security?.type === 'reality') {
        preserved.push('Reality TLS', 'server_name', 'public_key', 'short_id', 'utls fingerprint');
      }
      if (config.transport?.type === 'ws') preserved.push('WebSocket Transport');
      if (config.transport?.type === 'grpc') preserved.push('gRPC Transport');

      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'vmess') {
      preserved.push('Server', 'Server Port', 'Client UUID', 'Security/Cipher', 'alter_id');
      if (config.security?.type === 'tls') preserved.push('TLS');
      if (config.transport?.type === 'ws') preserved.push('WebSocket Transport');
      if (config.transport?.type === 'grpc') preserved.push('gRPC Transport');

      return {
        compatible: true,
        level: 'compatible',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'trojan') {
      preserved.push('Server', 'Server Port', 'Password Authentication', 'TLS (server_name)');
      if (config.transport?.type === 'ws') preserved.push('WebSocket Transport');
      if (config.transport?.type === 'grpc') preserved.push('gRPC Transport');

      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'wireguard') {
      preserved.push('Server', 'Server Port', 'private_key', 'peer_public_key', 'local_address', 'mtu');
      if (config.peers?.[0]?.presharedKey) preserved.push('pre_shared_key');

      const hasAwg = config.amnezia && (config.amnezia.s1 || config.amnezia.s2 || config.amnezia.jc !== 5);
      if (hasAwg) {
        warnings.push('Custom AmneziaWG packet obfuscation headers are not supported by standard vanilla Sing-Box WireGuard. Reserved bytes are preserved.');
        unsupported.push('AmneziaWG packet header mutations (H1-H4, Jc)');
      }

      return {
        compatible: true,
        level: hasAwg ? 'partial' : 'exact',
        preserved,
        unsupported,
        warnings
      };
    }
  }

  // ==================== XRAY JSON TARGET ====================
  if (targetLower === 'xray' || targetLower === 'json') {
    if (proto === 'vless') {
      preserved.push('vnext (address, port)', 'users (id, encryption, flow)');
      if (config.security?.type === 'reality') {
        preserved.push('streamSettings.security (reality)', 'realitySettings (serverName, publicKey, shortId, fingerprint)');
      } else if (config.security?.type === 'tls') {
        preserved.push('streamSettings.security (tls)', 'tlsSettings (serverName, alpn, fingerprint)');
      }
      if (config.transport?.type === 'ws') preserved.push('streamSettings.wsSettings (path, headers)');
      if (config.transport?.type === 'grpc') preserved.push('streamSettings.grpcSettings (serviceName)');

      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'vmess') {
      preserved.push('vnext (address, port)', 'users (id, alterId, security)', 'streamSettings');
      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'trojan') {
      preserved.push('servers (address, port, password)', 'streamSettings.security (tls)', 'streamSettings (transport)');
      return {
        compatible: true,
        level: 'exact',
        preserved,
        unsupported,
        warnings
      };
    }

    if (proto === 'wireguard') {
      preserved.push('settings (secretKey, address, mtu)', 'peers (endpoint, publicKey, keepAlive, allowedIPs)');
      if (config.peers?.[0]?.presharedKey) preserved.push('preSharedKey');
      preserved.push('Xray UDP Noise & Stream Fragment masks');

      return {
        compatible: true,
        level: 'compatible',
        preserved,
        unsupported,
        warnings
      };
    }
  }

  return {
    compatible: false,
    level: 'unsupported',
    preserved: [],
    unsupported: [`Unknown target format '${target}'`],
    warnings: []
  };
}
