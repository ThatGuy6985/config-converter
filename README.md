# Universal Proxy Converter v4.0

A high-fidelity, client-side proxy configuration parser and multi-target exporter supporting **VLESS**, **VMess**, **Trojan**, **WireGuard**, and **AmneziaWG**.

Exports to **Clash Meta (Mihomo)**, **Sing-Box**, **Xray Core**, and **AmneziaWG** with field-level preservation analysis, input validation, and security hardening.

---

## Architecture Overview

```text
                               ┌──────────────────────────────────────────────────────────┐
                               │                    RAW USER INPUT                        │
                               │   (URI Links / Base64 / WireGuard INI / Full Xray JSON)  │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────┐
                                               │   Input Auto-Detector   │
                                               │      & Safe Base64      │
                                               └────────────┬────────────┘
                                                            │
                     ┌───────────────────────┬──────────────┴───────────────┬───────────────────────┐
                     ▼                       ▼                              ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐            ┌──────────────────┐    ┌────────────────────┐
            │   VLESS Parser  │    │   VMess Parser  │            │  Trojan Parser   │    │  WireGuard Parser  │
            │  (UUID, Reality,│    │ (Base64 JSON,   │            │(Password-based,  │    │ (Multi-Peer INI,   │
            │   Flow, Transp) │    │  aid, cipher)   │            │ TLS, Transports) │    │  AWG Obfuscation)  │
            └────────┬────────┘    └────────┬────────┘            └─────────┬────────┘    └─────────┬──────────┘
                     │                      │                               │                       │
                     └──────────────────────┼───────────────────────────────┴───────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ NORMALIZED DATA MODELS  │
                               │   (Strict Separation)   │
                               └────────────┬────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             ▼                             ▼
                  ┌──────────────────────┐      ┌──────────────────────┐
                  │ Model & Constraint   │      │ Target Compatibility │
                  │      Validation      │      │ & Preservation Check │
                  └──────────┬───────────┘      └──────────┬───────────┘
                             │                             │
                             └──────────────┬──────────────┘
                                            │
                                            ▼
                                ┌──────────────────────┐
                                │   Routing Policy     │
                                │  (Abstract Layer)    │
                                └───────────┬──────────┘
                                            │
                     ┌──────────────────────┼───────────────────────────────┬───────────────────────┐
                     ▼                      ▼                               ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐            ┌──────────────────┐    ┌────────────────────┐
            │ Clash Meta Exp  │    │  Sing-Box Exp   │            │     Xray Exp     │    │   AmneziaWG Exp    │
            │ (YAML, Reality, │    │  (JSON Schema,  │            │ (JSON Outbounds, │    │ (Multi-Peer INI,   │
            │  WS/gRPC Opts)  │    │  Reality, utls) │            │  Trojan servers) │    │   Jc, S1-S4, H1-H4)│
            └─────────────────┘    └─────────────────┘            └──────────────────┘    └────────────────────┘
```

---

## Key Features & Fixes

1. **Protocol-Specific Models & Credential Handling**:
   - **VLESS**: Uses `authentication.uuid`. Never sets a spurious password field. Fully preserves Reality public key (`pbk`), short ID (`sid`), client fingerprint (`fp`), and flow (`flow`).
   - **Trojan**: Uses `authentication.password`. Never treats passwords as UUIDs. Fixes invalid `vnext` mapping in Xray (correctly generates `settings.servers`) and invalid `uuid` fields in Sing-Box/Clash.
   - **VMess**: Parses Base64 JSON payloads, preserving `uuid`, `alterId`, cipher/security, transport networks, and TLS headers.
   - **WireGuard & AmneziaWG**: Fully supports multiple `[Peer]` blocks without overwriting earlier peers. Preserves IPv4/IPv6 CIDR addresses, bracketed IPv6 endpoints, and AWG obfuscation headers (`Jc`, `Jmin`, `Jmax`, `S1..S4`, `H1..H4`, `I1`, `I2`).

2. **Field-Level Preservation & Conversion Report**:
   - The UI displays an interactive **Conversion Report** showing exact status (`Exact`, `Compatible`, `Partial`, `Unsupported`), tracking which attributes were preserved and flagging any unsupported features.
   - Non-WireGuard protocols are blocked from generating misleading AmneziaWG output.

3. **Security Hardening**:
   - **Local Listener Default**: Inbound mixed listeners default to `127.0.0.1` and `allow-lan: false` rather than exposing proxies to the public interface.
   - **Protected Secrets**: Sensitive inputs (WireGuard Private Key, PSK) use password inputs with show/hide eye toggles.
   - **SSRF & CORS Protection**: Online subscription URL fetching blocks localhost, loopback, private RFC 1918 subnets, and link-local ranges, with a 12-second timeout and 5MB size ceiling.
   - **Zero Secret Persistence**: No credentials are saved to `localStorage`, session storage, or query parameters.

4. **Modern, Accessible UI**:
   - Semantic HTML `<button>` elements with WAI-ARIA tab semantics (`role="tab"`, `role="tablist"`, `aria-selected`, `aria-expanded`).
   - Full keyboard navigation across tabs and expandable details.
   - Zero inline event handlers (`onclick`).

---

## Directory Structure

```text
├── index.html                   # Standalone zero-dependency distribution
├── package.json                 # Project scripts (test, build)
├── scripts/
│   ├── build.js                 # Bundles modular CSS & JS into standalone index.html
│   └── serve.js                 # Local dev server for manual verification
├── css/
│   ├── variables.css            # Design tokens, palette, and typography
│   ├── layout.css               # Double-bezel card structure and grid
│   ├── components.css           # Buttons, tabs, inputs, badges, reports
│   └── responsive.css           # Mobile & tablet viewports
├── js/
│   ├── models/
│   │   └── types.js             # Normalized protocol data models
│   ├── utils/
│   │   ├── endpoint.js          # Robust IPv4/IPv6 endpoint parser
│   │   ├── base64.js            # URL-safe Base64 and UTF-8 decoder
│   │   ├── escaping.js          # Safe YAML escaping and HTML sanitization
│   │   ├── clipboard.js         # Async clipboard helper with fallback
│   │   ├── download.js          # Client-side file downloader
│   │   └── qr.js                # Payload-safe QR code renderer
│   ├── parsers/
│   │   ├── vless.js             # VLESS URI parser
│   │   ├── vmess.js             # VMess Base64 JSON parser
│   │   ├── trojan.js            # Trojan URI parser
│   │   ├── wireguard.js         # Multi-peer WireGuard / AmneziaWG parser
│   │   └── detector.js          # Multi-input detection coordinator
│   ├── validation/
│   │   ├── input.js             # Input syntax checks (UUID, base64 key, ports)
│   │   ├── model.js             # Normalized model constraint validation
│   │   └── compatibility.js     # Target compatibility matrix & field preservation
│   ├── routing/
│   │   └── policy.js            # Abstract routing policy (Direct, IR bypass, Proxy)
│   ├── exporters/
│   │   ├── clash.js             # Clash Meta YAML builders
│   │   ├── singbox.js           # Sing-Box JSON builders
│   │   ├── xray.js              # Xray JSON outbound builders
│   │   └── amnezia.js           # AmneziaWG INI builder & preset system
│   ├── ui/
│   │   ├── tabs.js              # ARIA tablist manager
│   │   ├── configs.js           # Config items renderer
│   │   ├── status.js            # Status notification banners
│   │   └── report.js            # Conversion report component
│   ├── state.js                 # Central reactive application state
│   └── app.js                   # Application coordinator & event bindings
└── tests/
    ├── fixtures/
    │   └── sample-configs.js    # Realistic test inputs
    ├── parsers/
    │   └── parsers.test.js      # Parser test suite
    ├── validation/
    │   └── validation.test.js   # Model & compatibility test suite
    └── exporters/
        ├── exporters.test.js    # Exporter test suite
        └── roundtrip.test.js    # Round-trip fidelity test suite
```

---

## Running Automated Tests

Run the test suite natively with Node (v20+):

```bash
npm test
```

### Test Coverage Highlights:
- **39 automated test cases across 14 test suites**.
- VLESS Reality, WebSocket, and gRPC parsing.
- Trojan password isolation and absence of UUID.
- VMess Base64 decoding, alterId, cipher, and TLS.
- WireGuard multi-peer parsing and Amnezia header extraction.
- Target compatibility validation for all protocol / exporter pairs.
- Xray Trojan `servers` array schema verification.
- Round-trip fidelity testing for Reality and AmneziaWG.

---

## Building the Standalone Distribution

To rebuild `index.html` after modifying any CSS or JS module:

```bash
npm run build
```

The resulting `index.html` is 100% self-contained and operates offline without needing an active Node or HTTP server.
