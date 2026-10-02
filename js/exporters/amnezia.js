/**
 * AmneziaWG (AWG) INI Exporter with Multi-Peer Support & Preset System
 */

export const AWG_PRESETS = {
  noisy: {
    name: 'Default Noisy (5/50/100)',
    description: 'Standard randomized packet size variance with moderate jitter.',
    params: {
      jc: 5, jmin: 50, jmax: 100,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '', i2: ''
    }
  },
  stun: {
    name: 'WG Mimic STUN',
    description: 'Shapes handshake packets to match STUN UDP protocol signatures.',
    params: {
      jc: 7, jmin: 65, jmax: 191,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '<b 0x000100002112a442000000000000000000000000>',
      i2: '<b 0x010100282112a442000000000000000000000000000100080001000200000000>'
    }
  },
  dns: {
    name: 'WG Mimic DNS',
    description: 'Shapes UDP packet headers to mimic standard DNS query structures.',
    params: {
      jc: 5, jmin: 50, jmax: 120,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '<b 0x0000010000010000000000000377777706676f6f676c6503636f6d0000010001>',
      i2: '<b 0x0000818000010001000000000377777706676f6f676c6503636f6d0000010001c00c000100010000012c00047f000001>'
    }
  },
  http: {
    name: 'WG Mimic HTTP',
    description: 'Encapsulates handshake signatures with plain HTTP header fragments.',
    params: {
      jc: 6, jmin: 60, jmax: 180,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '<b 0x474554202f20485454502f312e310d0a486f73743a207777772e6578616d706c652e636f6d0d0a557365722d4167656e743a204d6f7a696c6c612f352e300d0a4163636570743a202a2f2a0d0a0d0a>',
      i2: '<b 0x485454502f312e3120323030204f4b0d0a436f6e74656e742d4c656e6774683a20300d0a436f6e6e656374696f6e3a20636c6f73650d0a0d0a>'
    }
  },
  sip: {
    name: 'WG Mimic SIP',
    description: 'Formats initial packets to match SIP VoIP signaling patterns.',
    params: {
      jc: 7, jmin: 65, jmax: 191,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '<b 0x4f5054494f4e53207369703a6672616e6b4062696c6f78692e636f6d205349502f322e300d0a5669613a205349502f322e302f55445020706336352e7369702e6578616d706c652e6f72673b6272616e63683d7a39684734624b30744d6553784e62445970755333770d0a4d61782d466f7277617264733a2036390d0a546f3a204672616e6b203c7369703a6672616e6b4062696c6f78692e636f6d3e0d0a46726f6d3a204865696469203c7369703a6865696469407369702e6578616d706c652e6f72673e3b7461673d36353437313737340d0a43616c6c2d49443a206664616262323134613530333535616440706336352e7369702e6578616d706c652e6f72670d0a435365713a20373632383733204f5054494f4e530d0a436f6e746163743a203c7369703a686569646940706336352e7369702e6578616d706c652e6f72673e0d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>',
      i2: '<b 0x5349502f322e3020323030204f4b0d0a5669613a205349502f322e302f55445020706336352e7369702e6578616d706c652e6f72673b6272616e63683d7a39684734624b30744d6553784e62445970755333770d0a546f3a204672616e6b203c7369703a6672616e6b4062696c6f78692e636f6d3e0d0a46726f6d3a204865696469203c7369703a6865696469407369702e6578616d706c652e6f72673e3b7461673d36353437313737340d0a43616c6c2d49443a206664616262323134613530333535616440706336352e7369702e6578616d706c652e6f72670d0a435365713a20373632383733204f5054494f4e530d0a436f6e74656e742d4c656e6774683a20300d0a0d0a>'
    }
  },
  quic: {
    name: 'WG Mimic QUIC',
    description: 'Mimics initial QUIC connection handshake frame layouts.',
    params: {
      jc: 4, jmin: 48, jmax: 160,
      s1: 0, s2: 0, s3: 0, s4: 0,
      h1: 1, h2: 2, h3: 3, h4: 4,
      i1: '<b 0xc00000000100000000000000000000000000000000000000000000000000000000000000>',
      i2: '<b 0xc00000000100000000000000000000000000000000000000000000000000000000000000>'
    }
  }
};

/**
 * Randomize AmneziaWG parameters within valid protocol boundaries.
 */
export function generateRandomAmneziaParams() {
  const jmin = Math.floor(Math.random() * 40) + 20;
  const jmax = jmin + Math.floor(Math.random() * 60) + 20;
  const jc = Math.floor(Math.random() * 8) + 3;
  const s1 = Math.floor(Math.random() * 50) + 15;
  const s2 = Math.floor(Math.random() * 50) + 15;
  const s3 = 0;
  const s4 = 0;

  // 4 distinct 32-bit positive integer headers
  const headerSet = new Set();
  while (headerSet.size < 4) {
    headerSet.add(Math.floor(Math.random() * 2147483647) + 1);
  }
  const [h1, h2, h3, h4] = Array.from(headerSet);

  return {
    jc, jmin, jmax,
    s1, s2, s3, s4,
    h1, h2, h3, h4,
    i1: '', i2: ''
  };
}

export function buildAmneziaWG(config, settings = {}) {
  if (!config || config.protocol !== 'wireguard') {
    return '# AmneziaWG export is only available for WireGuard configurations.\n';
  }

  const awg = config.amnezia || settings.awg || {
    jc: 5, jmin: 50, jmax: 100,
    s1: 0, s2: 0, s3: 0, s4: 0,
    h1: 1, h2: 2, h3: 3, h4: 4,
    i1: '', i2: ''
  };

  const dns = settings.dns || config.interface?.dns?.join(', ') || '1.1.1.1';
  const mtu = settings.mtu || config.interface?.mtu || 1280;
  const addresses = config.interface?.addresses?.join(', ') || '172.16.0.2/32';

  let conf = `[Interface]
PrivateKey = ${config.interface?.privateKey || ''}
Address = ${addresses}
DNS = ${dns}
MTU = ${mtu}
Jc = ${awg.jc}
Jmin = ${awg.jmin}
Jmax = ${awg.jmax}
S1 = ${awg.s1}
S2 = ${awg.s2}
S3 = ${awg.s3 || 0}
S4 = ${awg.s4 || 0}
H1 = ${awg.h1}
H2 = ${awg.h2}
H3 = ${awg.h3}
H4 = ${awg.h4}
`;

  if (awg.i1) conf += `I1 = ${awg.i1}\n`;
  if (awg.i2) conf += `I2 = ${awg.i2}\n`;

  const peers = config.peers && config.peers.length > 0
    ? config.peers
    : [
        {
          publicKey: '',
          endpoint: { host: '127.0.0.1', port: 51820 },
          allowedIPs: ['0.0.0.0/0', '::/0'],
          persistentKeepalive: 25,
          presharedKey: null
        }
      ];

  peers.forEach(peer => {
    const host = peer.endpoint?.host || '127.0.0.1';
    const port = peer.endpoint?.port || 51820;
    const formattedEp = host.includes(':') && !host.startsWith('[') ? `[${host}]:${port}` : `${host}:${port}`;

    conf += `\n[Peer]
PublicKey = ${peer.publicKey || ''}
AllowedIPs = ${peer.allowedIPs?.length > 0 ? peer.allowedIPs.join(', ') : '0.0.0.0/0, ::/0'}
Endpoint = ${formattedEp}
PersistentKeepalive = ${peer.persistentKeepalive || settings.keepalive || 25}
`;
    if (peer.presharedKey) {
      conf += `PresharedKey = ${peer.presharedKey}\n`;
    }
  });

  return conf;
}
