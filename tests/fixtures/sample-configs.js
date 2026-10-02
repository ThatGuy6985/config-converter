export const SAMPLE_VLESS_REALITY =
  'vless://b0e77457-3f8d-4f10-9118-dfb79872e612@cloudflare.com:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=zoom.us&fp=chrome&pbk=1yH_K5F1q5N5Z8X9V4B7N1M2K3L4P5O6I7U8Y9T0R1E&sid=ab12cd34&type=tcp#VLESS%20Reality%20US';

export const SAMPLE_VLESS_WS =
  'vless://a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d@speedtest.net:80?type=ws&path=%2Fcustom-ws&host=my-cdn.com&security=none#VLESS%20WebSocket';

export const SAMPLE_VLESS_GRPC =
  'vless://c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f@grpc.example.com:443?type=grpc&serviceName=my-grpc-service&security=tls&sni=grpc.example.com&fp=safari#VLESS%20gRPC%20TLS';

export const SAMPLE_TROJAN_BASIC =
  'trojan://mySecretPass123@trojan.example.com:443?security=tls&sni=trojan.example.com&alpn=h2,http/1.1#Trojan%20Server';

export const SAMPLE_TROJAN_WS =
  'trojan://secureTrojanPswd@trojan-ws.example.com:443?security=tls&type=ws&path=%2Ftrojan-path&host=trojan-ws.example.com#Trojan%20WS';

const vmessRawJson = JSON.stringify({
  v: '2',
  ps: 'VMess Test Node',
  add: 'vmess.example.com',
  port: '443',
  id: 'd9b8a7c6-b5a4-3210-9876-543210abcdef',
  aid: '0',
  scy: 'auto',
  net: 'ws',
  type: 'none',
  host: 'vmess.example.com',
  path: '/vmess-ws',
  tls: 'tls',
  sni: 'vmess.example.com',
  alpn: 'h2'
});

export const SAMPLE_VMESS_BASE64 = `vmess://${Buffer.from(vmessRawJson).toString('base64')}`;

export const SAMPLE_WIREGUARD_SINGLE_PEER = `[Interface]
PrivateKey = aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxkMTI=
Address = 10.0.0.2/32, fd00::2/128
DNS = 1.1.1.1, 8.8.8.8
MTU = 1360

[Peer]
PublicKey = dGVzdHB1YmxpY2tleXRlc3RwdWJsaWNrZXl0ZXN0MTI=
PresharedKey = dGVzdHByZXNoYXJlZGtleXRlc3RwcmVzaGFyZWQxMg==
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 198.51.100.1:51820
PersistentKeepalive = 20
`;

export const SAMPLE_WIREGUARD_MULTI_PEER_AWG = `[Interface]
PrivateKey = aGVsbG93b3JsZGhlbGxvd29ybGRoZWxsb3dvcmxkMTI=
Address = 172.16.0.2/32
DNS = 1.1.1.1
MTU = 1280
Jc = 7
Jmin = 65
Jmax = 191
S1 = 15
S2 = 25
S3 = 0
S4 = 0
H1 = 123456
H2 = 654321
H3 = 987654
H4 = 456789

[Peer]
PublicKey = cGVlcjFwdWJsaWNrZXlwZWVyMXB1YmxpY2tleXRlc3Q=
Endpoint = 203.0.113.10:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

[Peer]
PublicKey = cGVlcjJwdWJsaWNrZXlwZWVyMnB1YmxpY2tleXRlc3Q=
Endpoint = [2001:db8::10]:51820
AllowedIPs = ::/0
PersistentKeepalive = 30
`;
