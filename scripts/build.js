import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
    bundledCss += '\n' + fs.readFileSync(filePath, 'utf-8');
  }
}

const jsFiles = [
  'js/models/types.js',
  'js/utils/endpoint.js',
  'js/utils/base64.js',
  'js/utils/escaping.js',
  'js/utils/clipboard.js',
  'js/utils/download.js',
  'js/utils/qr.js',
  'js/utils/icons.js',
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
  'js/ui/stepper.js',
  'js/ui/dropdown.js',
  'js/ui/particles.js',
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

        content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    content = content.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

        content = content.replace(/^export\s+(async\s+function|function|class|const|let|var)\s+/gm, '$1 ');

        content = content.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
    content = content.replace(/^export\s+default\s+[^;]+;?\s*$/gm, '');

    bundledJs += '\n' + content + '\n';
  }
}

bundledJs += `
const ThemeManager = {
  getSystemTheme: function() {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },
  getTheme: function() {
    return document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
  },
  setTheme: function(theme, persist) {
    if (persist === undefined) persist = true;
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
    }
    const toggle = document.querySelector('.theme-switch__checkbox');
    if (toggle) {
      toggle.checked = theme === 'dark';
    }
    if (typeof window !== 'undefined' && window.ParticleDriftBg && typeof window.ParticleDriftBg.setMode === 'function') {
      window.ParticleDriftBg.setMode(theme);
    }
  },
  toggle: function() {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next, true);
  },
  init: function() {
    let theme = null;
    try {
      theme = localStorage.getItem('theme');
    } catch (e) {}
    if (!theme) {
      theme = this.getSystemTheme();
      this.setTheme(theme, false);
    } else {
      this.setTheme(theme, false);
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        try {
          if (!localStorage.getItem('theme')) {
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        } catch (err) {}
      });
    }

    const toggle = document.querySelector('.theme-switch__checkbox');
    if (toggle) {
      toggle.checked = (document.documentElement.getAttribute('data-theme') || theme) === 'dark';
      toggle.addEventListener('change', (e) => {
        this.setTheme(e.target.checked ? 'dark' : 'light', true);
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  initParticleDrift();
  setupNumberSteppers();
  setupAnimatedDropdowns();

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

function renderNumberControl(id, value, min, max, label) {
  const minAttr = min !== undefined ? ` min="${min}"` : '';
  const maxAttr = max !== undefined ? ` max="${max}"` : '';
  const ariaLabelUp = label ? `Increase ${label}` : 'Increase';
  const ariaLabelDown = label ? `Decrease ${label}` : 'Decrease';
  return `<div class="number-control">
    <input type="number" id="${id}" value="${value}"${minAttr}${maxAttr} autocomplete="off" />
    <div class="number-steppers">
      <button type="button" class="stepper-btn" data-step="up" data-target="${id}" aria-label="${ariaLabelUp}" tabindex="-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
      </button>
      <button type="button" class="stepper-btn" data-step="down" data-target="${id}" aria-label="${ariaLabelDown}" tabindex="-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
  </div>`;
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Professional client-side multi-protocol proxy configuration converter for VLESS, VMess, Trojan, WireGuard, and AmneziaWG."/>
  <script>
    (function() {
      try {
        var saved = null;
        try { saved = localStorage.getItem('theme'); } catch(e) {}
        var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = saved ? saved : (systemDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
${bundledCss}
  </style>
</head>
<body>
  <canvas id="particle-drift-canvas" class="particle-drift-canvas" aria-hidden="true"></canvas>
  <main class="container">
    <header class="app-header">
      <div class="header-top-row">
        <div class="app-eyebrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Enterprise Multi-Protocol Converter v4.0
        </div>
        <a href="https://github.com/ThatGuy6985/config-converter" target="_blank" rel="noopener noreferrer" class="github-star-btn" aria-label="Star ThatGuy6985/config-converter on GitHub">
          <svg class="github-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
          <span class="github-star-text">Star on GitHub</span>
          <svg class="star-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </a>
        <div class="theme-toggle-wrapper" title="Switch Theme (Dark / Light)">
          <label class="theme-switch" aria-label="Toggle dark and light mode">
            <input type="checkbox" class="theme-switch__checkbox" checked aria-label="Dark mode toggle switch" />
            <div class="theme-switch__container">
              <div class="theme-switch__clouds"></div>
              <div class="theme-switch__stars-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none" aria-hidden="true">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor" />
                </svg>
              </div>
              <div class="theme-switch__circle-container">
                <div class="theme-switch__sun-moon-container">
                  <div class="theme-switch__moon">
                    <div class="theme-switch__spot"></div>
                    <div class="theme-switch__spot"></div>
                    <div class="theme-switch__spot"></div>
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
      <h1 class="app-title">Universal <span>Proxy Converter</span></h1>
      <p class="app-subtitle">
        Normalized client-side engine for VLESS, VMess, Trojan, WireGuard & AmneziaWG. Target-specific exports for Clash Meta, Sing-Box & Xray with field-level preservation analysis.
      </p>
    </header>

    <div class="workspace-grid">
      <section class="card-bezel" aria-label="Input and Settings">
        <div class="card-core">
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

          <div id="pasteSection" role="tabpanel" aria-labelledby="modePaste">
            <label for="inputData">URI Links / WireGuard INI / Full Xray JSON / Base64</label>
            <textarea id="inputData" placeholder="Paste vless://, trojan://, vmess://, WireGuard INI, or subscription links..." spellcheck="false" autocomplete="off"></textarea>

            <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <button type="button" class="secondary" id="btnFetchSub" style="padding:6px 14px; font-size:12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                Fetch Subscription URL
              </button>
              <span class="field-note">Direct browser fetch (CORS policies apply)</span>
            </div>
            <div id="fetchLog" class="fetch-log" style="font-size:11.5px;color:var(--text-muted);margin-top:6px;max-height:80px;overflow-y:auto;"></div>
          </div>

          <div id="manualSection" class="hidden" role="tabpanel" aria-labelledby="modeManual">
            <div class="section-title">
              <span>WireGuard Credentials</span>
              <span class="field-note">Protected Inputs</span>
            </div>

            <label for="manualPrivate">Private Key</label>
            <div class="secret-input-wrapper" style="margin-bottom:10px;">
              <input type="password" id="manualPrivate" placeholder="Base64 32-byte private key" autocomplete="off" spellcheck="false" />
              <button type="button" class="secret-toggle-btn" data-target="manualPrivate" aria-label="Toggle private key visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
                ${renderNumberControl('manualKeepalive', 25, 0, 3600, 'Keepalive')}
              </div>
            </div>

            <label for="manualAllowed" style="margin-top:6px;">Allowed IPs</label>
            <input type="text" id="manualAllowed" value="0.0.0.0/0, ::/0" autocomplete="off" style="margin-bottom:10px;" />

            <label for="manualPSK">Preshared Key (Optional)</label>
            <div class="secret-input-wrapper">
              <input type="password" id="manualPSK" placeholder="Optional Base64 preshared key" autocomplete="off" spellcheck="false" />
              <button type="button" class="secret-toggle-btn" data-target="manualPSK" aria-label="Toggle PSK visibility">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <div class="section-title">
            <span>Global Defaults & Routing</span>
          </div>
          <div class="row row-cols-3">
            <div>
              <label for="dns">Remote DNS</label>
              <input type="text" id="dns" value="1.1.1.1" autocomplete="off" />
            </div>
            <div>
              <label for="mtu">MTU</label>
              ${renderNumberControl('mtu', 1280, 576, 9000, 'MTU')}
            </div>
            <div>
              <label for="globalKeepalive">Default Keepalive</label>
              ${renderNumberControl('globalKeepalive', 25, 0, 3600, 'Keepalive')}
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

          <div class="row row-cols-3">
            <div><label for="jc">Jc</label>${renderNumberControl('jc', 5, 0, 128, 'Jc')}</div>
            <div><label for="jmin">Jmin</label>${renderNumberControl('jmin', 50, 0, 65535, 'Jmin')}</div>
            <div><label for="jmax">Jmax</label>${renderNumberControl('jmax', 100, 0, 65535, 'Jmax')}</div>
          </div>

          <div class="row row-cols-4">
            <div><label for="s1">S1</label>${renderNumberControl('s1', 0, 0, 65535, 'S1')}</div>
            <div><label for="s2">S2</label>${renderNumberControl('s2', 0, 0, 65535, 'S2')}</div>
            <div><label for="s3">S3</label>${renderNumberControl('s3', 0, 0, 65535, 'S3')}</div>
            <div><label for="s4">S4</label>${renderNumberControl('s4', 0, 0, 65535, 'S4')}</div>
          </div>

          <div class="row row-cols-4">
            <div><label for="h1">H1</label>${renderNumberControl('h1', 1, undefined, undefined, 'H1')}</div>
            <div><label for="h2">H2</label>${renderNumberControl('h2', 2, undefined, undefined, 'H2')}</div>
            <div><label for="h3">H3</label>${renderNumberControl('h3', 3, undefined, undefined, 'H3')}</div>
            <div><label for="h4">H4</label>${renderNumberControl('h4', 4, undefined, undefined, 'H4')}</div>
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

          <div class="btn-row">
            <button type="button" id="btnConvert">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Parse / Refresh
            </button>
            <button type="button" class="secondary" id="btnRandomize">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dices" aria-hidden="true"><rect width="12" height="12" x="2" y="10" rx="2" ry="2"></rect><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3.18l-5.74-5.74a2.24 2.24 0 0 0-3.18 0L9 5.08"></path><path d="M6 14h.01"></path><path d="M10 18h.01"></path><path d="M14 14h.01"></path><path d="M10 14h.01"></path><path d="m15 9 1-1"></path><path d="m12 6 1-1"></path></svg>
              Randomize AWG
            </button>
            <button type="button" class="secondary" id="btnClear">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2" aria-hidden="true"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
              Clear All
            </button>
          </div>

          <div id="statusBanner" class="status-banner" role="status" aria-live="polite"></div>
        </div>
      </section>

      <section class="card-bezel" aria-label="Output and Export">
        <div class="card-core">
          <div class="action-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="font-weight:700;color:var(--accent);font-size:14px;" id="configCountText">Parsed Configs</div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="success-btn" id="btnCopyAllLinks" style="padding:6px 14px;font-size:12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                Copy Links
              </button>
              <button type="button" class="secondary" id="btnToggleExpandAll" style="padding:6px 14px;font-size:12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-down" aria-hidden="true"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>
                Expand All
              </button>
            </div>
          </div>

          <div id="configList" style="max-height:280px;overflow-y:auto;margin-bottom:14px;" role="list" aria-label="Parsed Configurations"></div>

          <div id="reportContainer" class="conversion-report hidden" aria-live="polite"></div>

          <div class="section-title">
            <span>Target Export</span>
          </div>

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
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              Copy Combined
            </button>
            <button type="button" class="secondary" id="btnDownload">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
              Download Config
            </button>
            <button type="button" class="secondary" id="btnToggleQr">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-qr-code" aria-hidden="true"><rect width="5" height="5" x="3" y="3" rx="1"></rect><rect width="5" height="5" x="16" y="3" rx="1"></rect><rect width="5" height="5" x="3" y="16" rx="1"></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3"></path><path d="M21 21v.01"></path><path d="M12 7v3a2 2 0 0 1-2 2H7"></path><path d="M3 12h.01"></path><path d="M12 3h.01"></path><path d="M12 16v.01"></path><path d="M16 12h1"></path><path d="M21 12v.01"></path><path d="M12 21v-1"></path></svg>
              Toggle QR Code
            </button>
          </div>

          <div id="qrWrapper" class="qr-wrapper" aria-live="polite">
            <label style="color:var(--text-main);margin-bottom:6px;font-weight:600;">Scan Export QR Code</label>
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

fs.writeFileSync(path.join(rootDir, 'index.html'), htmlTemplate, 'utf-8');
console.log('Successfully built standalone index.html (' + Buffer.byteLength(htmlTemplate) + ' bytes)');
