/**
 * Zero-Dependency Build Script
 * Bundles modular CSS and JS into a standalone production index.html
 * ensuring it works seamlessly both when served via HTTP and when opened directly via file://.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read CSS Files in order
const cssFiles = [
  'css/variables.css',
  'css/layout.css',
  'css/components.css',
  'css/responsive.css'
];

let bundledCss = '';
for (const file of cssFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    bundledCss += `\n/* === ${file} === */\n` + fs.readFileSync(filePath, 'utf-8');
  }
}

// 2. Read JS Files in topological dependency order
const jsFiles = [
  'js/models/types.js',
  'js/utils/endpoint.js',
  'js/utils/base64.js',
  'js/utils/escaping.js',
  'js/utils/clipboard.js',
  'js/utils/download.js',
  'js/utils/qr.js',
  'js/routing/policy.js',
  'js/parsers/vless.js',
  'js/parsers/trojan.js',
  'js/parsers/vmess.js',
  'js/parsers/wireguard.js',
  'js/parsers/detector.js',
  'js/validation/input.js',
  'js/validation/model.js',
  'js/validation/compatibility.js',
  'js/exporters/amnezia.js',
  'js/exporters/clash.js',
  'js/exporters/singbox.js',
  'js/exporters/xray.js',
  'js/state.js',
  'js/ui/tabs.js',
  'js/ui/configs.js',
  'js/ui/status.js',
  'js/ui/report.js',
  'js/app.js'
];

let bundledJs = '(function() {\n"use strict";\n\n';

for (const file of jsFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Strip ES import statements: import ... from '...';
    content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    content = content.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

    // Convert `export function foo` -> `function foo`
    content = content.replace(/^export\s+(async\s+function|function|class|const|let|var)\s+/gm, '$1 ');

    // Strip standalone `export { ... }` or `export default ...`
    content = content.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
    content = content.replace(/^export\s+default\s+[^;]+;?\s*$/gm, '');

    bundledJs += `\n/* ==================== ${file} ==================== */\n` + content + '\n';
  }
}

bundledJs += `
// ==================== Application Bootstrap ====================
document.addEventListener('DOMContentLoaded', () => {
  const domElements = {
    modePasteBtn: document.getElementById('modePaste'),
    modeManualBtn: document.getElementById('modeManual'),
    pasteSection: document.getElementById('pasteSection'),
    manualSection: document.getElementById('manualSection'),
    name: document.getElementById('name'),
    inputData: document.getElementById('inputData'),
    btnFetchSub: document.getElementById('btnFetchSub'),
    fetchLog: document.getElementById('fetchLog'),

    manualPrivate: document.getElementById('manualPrivate'),
    manualPublic: document.getElementById('manualPublic'),
    manualEndpoint: document.getElementById('manualEndpoint'),
    manualAddress: document.getElementById('manualAddress'),
    manualIPv6: document.getElementById('manualIPv6'),
    manualReserved: document.getElementById('manualReserved'),
    manualKeepalive: document.getElementById('manualKeepalive'),
    manualAllowed: document.getElementById('manualAllowed'),
    manualPSK: document.getElementById('manualPSK'),

    dns: document.getElementById('dns'),
    mtu: document.getElementById('mtu'),
    globalKeepalive: document.getElementById('globalKeepalive'),
    irBypass: document.getElementById('irBypass'),
    useNoise: document.getElementById('useNoise'),
    useFragment: document.getElementById('useFragment'),
    allowLan: document.getElementById('allowLan'),

    awgPreset: document.getElementById('awgPreset'),
    jc: document.getElementById('jc'),
    jmin: document.getElementById('jmin'),
    jmax: document.getElementById('jmax'),
    s1: document.getElementById('s1'),
    s2: document.getElementById('s2'),
    s3: document.getElementById('s3'),
    s4: document.getElementById('s4'),
    h1: document.getElementById('h1'),
    h2: document.getElementById('h2'),
    h3: document.getElementById('h3'),
    h4: document.getElementById('h4'),
    i1: document.getElementById('i1'),
    i2: document.getElementById('i2'),

    btnConvert: document.getElementById('btnConvert'),
    btnRandomize: document.getElementById('btnRandomize'),
    btnClear: document.getElementById('btnClear'),
    statusBanner: document.getElementById('statusBanner'),

    configCountText: document.getElementById('configCountText'),
    btnCopyAllLinks: document.getElementById('btnCopyAllLinks'),
    btnToggleExpandAll: document.getElementById('btnToggleExpandAll'),
    configList: document.getElementById('configList'),
    reportContainer: document.getElementById('reportContainer'),

    exportTablist: document.getElementById('exportTablist'),
    resultArea: document.getElementById('resultArea'),
    btnCopyResult: document.getElementById('btnCopyResult'),
    btnDownload: document.getElementById('btnDownload'),
    btnToggleQr: document.getElementById('btnToggleQr'),
    qrWrapper: document.getElementById('qrWrapper'),
    qrBox: document.getElementById('qrBox'),
    qrError: document.getElementById('qrError')
  };

  window.app = new App(domElements);
});
})();
`;

// 3. Assemble HTML Template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Professional client-side multi-protocol proxy configuration converter for VLESS, VMess, Trojan, WireGuard, and AmneziaWG."/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
  <!-- QRCode.js CDN for client-side QR generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
${bundledCss}
  </style>
</head>
<body>
  <main class="container">
    <header class="app-header">
      <div class="app-eyebrow">
        <span>⚡</span> Enterprise Multi-Protocol Converter v4.0
      </div>
      <h1 class="app-title">Universal <span>Proxy Converter</span></h1>
      <p class="app-subtitle">
        Normalized client-side engine for VLESS, VMess, Trojan, WireGuard & AmneziaWG. Target-specific exports for Clash Meta, Sing-Box & Xray with field-level preservation analysis.
      </p>
    </header>

    <div class="workspace-grid">
      <!-- LEFT PANEL: Configuration Input & Tuning -->
      <section class="card-bezel" aria-label="Input and Settings">
        <div class="card-core">
          <!-- Mode Switch Tabs -->
          <div class="mode-switch" role="tablist" aria-label="Input Mode Switch">
            <button type="button" class="mode-tab-btn active" id="modePaste" role="tab" aria-selected="true" aria-controls="pasteSection">
              Universal Import
            </button>
            <button type="button" class="mode-tab-btn" id="modeManual" role="tab" aria-selected="false" aria-controls="manualSection">
              Manual WireGuard
            </button>
          </div>

          <div style="margin-bottom:14px;">
            <label for="name">Proxy Tag / Name Override</label>
            <input type="text" id="name" value="Config-1" placeholder="Config-1" autocomplete="off" />
          </div>

          <!-- UNIVERSAL IMPORT MODE -->
          <div id="pasteSection" role="tabpanel" aria-labelledby="modePaste">
            <label for="inputData">URI Links / WireGuard INI / Full Xray JSON / Base64</label>
            <textarea id="inputData" placeholder="Paste vless://, trojan://, vmess://, WireGuard INI, or subscription links..." spellcheck="false" autocomplete="off"></textarea>
            
            <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <button type="button" class="secondary" id="btnFetchSub" style="padding:6px 14px; font-size:12px;">
                Fetch Subscription URL
              </button>
              <span class="field-note">Direct browser fetch (CORS policies apply)</span>
            </div>
            <div id="fetchLog" class="fetch-log" style="font-size:11.5px;color:var(--text-muted);margin-top:6px;max-height:80px;overflow-y:auto;"></div>
          </div>

          <!-- MANUAL WIREGUARD MODE -->
          <div id="manualSection" class="hidden" role="tabpanel" aria-labelledby="modeManual">
            <div class="section-title">
              <span>WireGuard Credentials</span>
              <span class="field-note">Protected Inputs</span>
            </div>

            <label for="manualPrivate">Private Key</label>
            <div class="secret-input-wrapper" style="margin-bottom:10px;">
              <input type="password" id="manualPrivate" placeholder="Base64 32-byte private key" autocomplete="off" spellcheck="false" />
              <button type="button" class="secret-toggle-btn" data-target="manualPrivate" aria-label="Toggle private key visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>

            <label for="manualPublic">Public Key</label>
            <input type="text" id="manualPublic" placeholder="Base64 peer public key" autocomplete="off" spellcheck="false" style="margin-bottom:10px;" />

            <label for="manualEndpoint">Endpoint (Host & Port)</label>
            <input type="text" id="manualEndpoint" placeholder="198.51.100.1:51820 or [2001:db8::1]:51820" autocomplete="off" spellcheck="false" style="margin-bottom:10px;" />

            <div class="row">
              <div>
                <label for="manualAddress">IPv4 Address</label>
                <input type="text" id="manualAddress" value="172.16.0.2/32" autocomplete="off" />
              </div>
              <div>
                <label for="manualIPv6">IPv6 Address (Optional)</label>
                <input type="text" id="manualIPv6" placeholder="fd00::2/128" autocomplete="off" />
              </div>
            </div>

            <div class="row">
              <div>
                <label for="manualReserved">Reserved Bytes</label>
                <input type="text" id="manualReserved" value="0, 0, 0" placeholder="0, 0, 0" autocomplete="off" />
              </div>
              <div>
                <label for="manualKeepalive">Keepalive (seconds)</label>
                <input type="number" id="manualKeepalive" value="25" min="0" max="3600" />
              </div>
            </div>

            <label for="manualAllowed" style="margin-top:6px;">Allowed IPs</label>
            <input type="text" id="manualAllowed" value="0.0.0.0/0, ::/0" autocomplete="off" style="margin-bottom:10px;" />

            <label for="manualPSK">Preshared Key (Optional)</label>
            <div class="secret-input-wrapper">
              <input type="password" id="manualPSK" placeholder="Optional Base64 preshared key" autocomplete="off" spellcheck="false" />
              <button type="button" class="secret-toggle-btn" data-target="manualPSK" aria-label="Toggle PSK visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <!-- GLOBAL DEFAULTS & SECURITY -->
          <div class="section-title">
            <span>Global Defaults & Routing</span>
          </div>
          <div class="row">
            <div>
              <label for="dns">Remote DNS</label>
              <input type="text" id="dns" value="1.1.1.1" autocomplete="off" />
            </div>
            <div>
              <label for="mtu">MTU</label>
              <input type="number" id="mtu" value="1280" min="576" max="9000" />
            </div>
            <div>
              <label for="globalKeepalive">Default Keepalive</label>
              <input type="number" id="globalKeepalive" value="25" min="0" max="3600" />
            </div>
          </div>

          <div class="row" style="margin-bottom:6px;">
            <div class="checkbox-field">
              <input type="checkbox" id="irBypass" checked />
              <label for="irBypass">Iran Direct Route <span class="field-note">(IR GeoIP / Domain bypass)</span></label>
            </div>
            <div class="checkbox-field">
              <input type="checkbox" id="allowLan" />
              <label for="allowLan">Allow LAN Access <span class="field-note">(Default: 127.0.0.1 local only)</span></label>
            </div>
          </div>

          <div class="row">
            <div class="checkbox-field">
              <input type="checkbox" id="useNoise" checked />
              <label for="useNoise">Noise ON <span class="field-note">(Xray UDP Noise Mask)</span></label>
            </div>
            <div class="checkbox-field">
              <input type="checkbox" id="useFragment" checked />
              <label for="useFragment">Fragment ON <span class="field-note">(Xray Stream Fragment)</span></label>
            </div>
          </div>

          <!-- AMNEZIA WG SETTINGS & PRESETS -->
          <div class="section-title">
            <span>AmneziaWG Obfuscation</span>
          </div>
          <div style="margin-bottom:10px;">
            <label for="awgPreset">Obfuscation Preset</label>
            <select id="awgPreset">
              <option value="noisy" selected>Default Noisy (Jc 5 / 50-100)</option>
              <option value="stun">WG Mimic STUN</option>
              <option value="dns">WG Mimic DNS</option>
              <option value="http">WG Mimic HTTP</option>
              <option value="sip">WG Mimic SIP</option>
              <option value="quic">WG Mimic QUIC</option>
              <option value="custom">Custom Profile</option>
            </select>
          </div>

          <div class="row">
            <div><label for="jc">Jc</label><input type="number" id="jc" value="5" min="0" max="128" /></div>
            <div><label for="jmin">Jmin</label><input type="number" id="jmin" value="50" min="0" max="65535" /></div>
            <div><label for="jmax">Jmax</label><input type="number" id="jmax" value="100" min="0" max="65535" /></div>
          </div>

          <div class="row">
            <div><label for="s1">S1</label><input type="number" id="s1" value="0" min="0" max="65535" /></div>
            <div><label for="s2">S2</label><input type="number" id="s2" value="0" min="0" max="65535" /></div>
            <div><label for="s3">S3</label><input type="number" id="s3" value="0" min="0" max="65535" /></div>
            <div><label for="s4">S4</label><input type="number" id="s4" value="0" min="0" max="65535" /></div>
          </div>

          <div class="row">
            <div><label for="h1">H1</label><input type="number" id="h1" value="1" /></div>
            <div><label for="h2">H2</label><input type="number" id="h2" value="2" /></div>
            <div><label for="h3">H3</label><input type="number" id="h3" value="3" /></div>
            <div><label for="h4">H4</label><input type="number" id="h4" value="4" /></div>
          </div>

          <div class="row">
            <div>
              <label for="i1">I1 Init Payload (Optional)</label>
              <input type="text" id="i1" placeholder="<b 0x...>" autocomplete="off" spellcheck="false" />
            </div>
            <div>
              <label for="i2">I2 Init Payload (Optional)</label>
              <input type="text" id="i2" placeholder="<b 0x...>" autocomplete="off" spellcheck="false" />
            </div>
          </div>

          <!-- PRIMARY ACTION BUTTONS -->
          <div class="btn-row">
            <button type="button" id="btnConvert">
              <span>⚡</span> Parse / Refresh
            </button>
            <button type="button" class="secondary" id="btnRandomize">
              <span>🎲</span> Randomize AWG
            </button>
            <button type="button" class="secondary" id="btnClear">
              Clear All
            </button>
          </div>

          <!-- Status Notification Banner -->
          <div id="statusBanner" class="status-banner" role="status" aria-live="polite"></div>
        </div>
      </section>

      <!-- RIGHT PANEL: Parsed Configs, Conversion Report & Export -->
      <section class="card-bezel" aria-label="Output and Export">
        <div class="card-core">
          <div class="action-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="font-weight:700;color:var(--primary);font-size:14px;" id="configCountText">Parsed Configs</div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="success-btn" id="btnCopyAllLinks" style="padding:6px 14px;font-size:12px;">
                Copy Links
              </button>
              <button type="button" class="secondary" id="btnToggleExpandAll" style="padding:6px 14px;font-size:12px;">
                Expand All
              </button>
            </div>
          </div>

          <!-- Parsed Config Items Container -->
          <div id="configList" style="max-height:280px;overflow-y:auto;margin-bottom:14px;" role="list" aria-label="Parsed Configurations"></div>

          <!-- Conversion Report Container -->
          <div id="reportContainer" class="conversion-report hidden" aria-live="polite"></div>

          <div class="section-title">
            <span>Target Export</span>
          </div>

          <!-- Export Target Tabs -->
          <div class="export-tabs" id="exportTablist" role="tablist" aria-label="Export Target Formats">
            <button type="button" class="tab-btn active" role="tab" aria-selected="true" data-tab="amnezia" id="tab-amnezia" aria-controls="resultArea">
              AmneziaWG
            </button>
            <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="clash" id="tab-clash" aria-controls="resultArea">
              Clash Meta
            </button>
            <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="singbox" id="tab-singbox" aria-controls="resultArea">
              Sing-Box
            </button>
            <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="json" id="tab-json" aria-controls="resultArea">
              Xray JSON
            </button>
          </div>

          <label for="resultArea" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">Export Output</label>
          <textarea id="resultArea" style="min-height:210px;" placeholder="Converted configuration will appear here..." readonly spellcheck="false" autocomplete="off"></textarea>

          <div class="btn-row">
            <button type="button" id="btnCopyResult">
              <span>📋</span> Copy Combined
            </button>
            <button type="button" class="secondary" id="btnDownload">
              <span>💾</span> Download Config
            </button>
            <button type="button" class="secondary" id="btnToggleQr">
              <span>📱</span> Toggle QR Code
            </button>
          </div>

          <!-- QR Code Wrapper Area -->
          <div id="qrWrapper" class="qr-wrapper" aria-live="polite">
            <label style="color:var(--primary);margin-bottom:6px;font-weight:600;">Scan Export QR Code</label>
            <div id="qrBox" class="qr-box"></div>
            <div id="qrError" class="qr-error"></div>
          </div>

        </div>
      </section>
    </div>
  </main>

  <script>
${bundledJs}
  </script>
</body>
</html>
`;

// 4. Write bundled index.html
fs.writeFileSync(path.join(rootDir, 'index.html'), htmlTemplate, 'utf-8');
console.log('Successfully built standalone index.html (' + Buffer.byteLength(htmlTemplate) + ' bytes)');
