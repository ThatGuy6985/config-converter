import { store } from './state.js';
import { parseAllInputs } from './parsers/detector.js';
import { createWireguardModel } from './models/types.js';
import { parseReservedBytes } from './parsers/wireguard.js';
import { validateNormalizedModel } from './validation/model.js';
import { checkCompatibility } from './validation/compatibility.js';
import { buildClashConfig } from './exporters/clash.js';
import { buildSingBoxConfig } from './exporters/singbox.js';
import { buildXrayJsonConfig } from './exporters/xray.js';
import { buildAmneziaWG, AWG_PRESETS, generateRandomAmneziaParams } from './exporters/amnezia.js';
import { copyText } from './utils/clipboard.js';
import { downloadFile } from './utils/download.js';
import { renderQrCode } from './utils/qr.js';
import { renderConfigList } from './ui/configs.js';
import { renderStatus } from './ui/status.js';
import { renderConversionReport } from './ui/report.js';
import { setupAccessibleTabs } from './ui/tabs.js';
import { renderIcon } from './utils/icons.js';

export class App {
  constructor(domElements) {
    this.dom = domElements;
    this.init();
  }

  init() {
    this.bindEvents();
    this.subscribeToState();
    this.applyPreset('noisy', false);
  }

  subscribeToState() {
    store.subscribe((state) => {

      const isPaste = state.mode === 'paste';
      this.dom.modePasteBtn.classList.toggle('active', isPaste);
      this.dom.modeManualBtn.classList.toggle('active', !isPaste);
      this.dom.pasteSection.classList.toggle('hidden', !isPaste);
      this.dom.manualSection.classList.toggle('hidden', isPaste);

      renderConfigList(this.dom.configList, state.configs, {
        allExpanded: state.allExpanded,
        settings: state.settings
      });

      const count = state.configs.length;
      this.dom.configCountText.textContent = `Parsed ${count} Config${count === 1 ? '' : 's'}`;

      this.updateExportOutput(state);

      renderStatus(this.dom.statusBanner, state.status);

      renderConversionReport(this.dom.reportContainer, state.report);

      if (this.dom.qrWrapper.classList.contains('active')) {
        this.generateQr();
      }
    });
  }

  bindEvents() {

    this.dom.modePasteBtn.addEventListener('click', () => store.setMode('paste'));
    this.dom.modeManualBtn.addEventListener('click', () => store.setMode('manual'));

    setupAccessibleTabs(this.dom.exportTablist, (tab) => {
      store.setCurrentTab(tab);
      this.recalculateReport();
    });

    this.dom.awgPreset.addEventListener('change', (e) => {
      this.applyPreset(e.target.value, true);
    });

    this.dom.btnRandomize.addEventListener('click', () => {
      this.randomizeAwg();
    });

    this.dom.manualReserved.addEventListener('input', () => {
      this.syncReservedToAmneziaInputs();
    });

    this.setupSecretToggles();

    this.dom.btnConvert.addEventListener('click', () => this.handleConvert());
    this.dom.btnClear.addEventListener('click', () => this.handleClear());
    this.dom.btnCopyAllLinks.addEventListener('click', () => this.handleCopyAllLinks());
    this.dom.btnToggleExpandAll.addEventListener('click', () => store.toggleExpandAll());
    this.dom.btnCopyResult.addEventListener('click', () => this.handleCopyResult());
    this.dom.btnDownload.addEventListener('click', () => this.handleDownload());
    this.dom.btnToggleQr.addEventListener('click', () => this.toggleQr());
    this.dom.btnFetchSub.addEventListener('click', () => this.handleFetchSubscription());

    const settingInputs = [
      this.dom.dns, this.dom.mtu, this.dom.globalKeepalive,
      this.dom.irBypass, this.dom.useNoise, this.dom.useFragment, this.dom.allowLan
    ];
    settingInputs.forEach(el => {
      if (!el) return;
      el.addEventListener('change', () => this.syncSettingsFromDom());
    });
  }

  setupSecretToggles() {
    const toggleBtns = document.querySelectorAll('.secret-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.setAttribute('aria-label', isPassword ? 'Hide secret' : 'Show secret');
        btn.innerHTML = isPassword
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      });
    });
  }

  syncReservedToAmneziaInputs() {
    const raw = this.dom.manualReserved.value;
    const [s1, s2, s3] = parseReservedBytes(raw);
    this.dom.s1.value = s1;
    this.dom.s2.value = s2;
    this.dom.s3.value = s3;
    this.syncSettingsFromDom();
  }

  applyPreset(presetKey, shouldNotify = true) {
    if (presetKey === 'custom') return;
    const preset = AWG_PRESETS[presetKey];
    if (!preset) return;

    const p = preset.params;
    this.dom.jc.value = p.jc;
    this.dom.jmin.value = p.jmin;
    this.dom.jmax.value = p.jmax;
    this.dom.s1.value = p.s1;
    this.dom.s2.value = p.s2;
    this.dom.s3.value = p.s3;
    this.dom.s4.value = p.s4;
    this.dom.h1.value = p.h1;
    this.dom.h2.value = p.h2;
    this.dom.h3.value = p.h3;
    this.dom.h4.value = p.h4;
    this.dom.i1.value = p.i1;
    this.dom.i2.value = p.i2;

    this.syncSettingsFromDom();

    if (shouldNotify) {
      store.setStatus('info', `Preset applied: ${preset.name}`, [preset.description]);
    }
  }

  randomizeAwg() {
    this.dom.awgPreset.value = 'custom';
    const rnd = generateRandomAmneziaParams();

    this.dom.jc.value = rnd.jc;
    this.dom.jmin.value = rnd.jmin;
    this.dom.jmax.value = rnd.jmax;
    this.dom.s1.value = rnd.s1;
    this.dom.s2.value = rnd.s2;
    this.dom.s3.value = 0;
    this.dom.s4.value = 0;
    this.dom.h1.value = rnd.h1;
    this.dom.h2.value = rnd.h2;
    this.dom.h3.value = rnd.h3;
    this.dom.h4.value = rnd.h4;
    this.dom.i1.value = '';
    this.dom.i2.value = '';

    this.syncSettingsFromDom();
    store.setStatus('info', 'AWG parameters randomized within valid protocol boundaries.');
  }

  syncSettingsFromDom() {
    const settings = {
      dns: this.dom.dns.value.trim() || '1.1.1.1',
      mtu: parseInt(this.dom.mtu.value, 10) || 1280,
      keepalive: parseInt(this.dom.globalKeepalive.value, 10) || 25,
      irBypass: this.dom.irBypass.checked,
      useNoise: this.dom.useNoise.checked,
      useFragment: this.dom.useFragment.checked,
      allowLan: this.dom.allowLan.checked,
      awgPreset: this.dom.awgPreset.value,
      awg: {
        jc: parseInt(this.dom.jc.value, 10) || 5,
        jmin: parseInt(this.dom.jmin.value, 10) || 50,
        jmax: parseInt(this.dom.jmax.value, 10) || 100,
        s1: parseInt(this.dom.s1.value, 10) || 0,
        s2: parseInt(this.dom.s2.value, 10) || 0,
        s3: parseInt(this.dom.s3.value, 10) || 0,
        s4: parseInt(this.dom.s4.value, 10) || 0,
        h1: parseInt(this.dom.h1.value, 10) || 1,
        h2: parseInt(this.dom.h2.value, 10) || 2,
        h3: parseInt(this.dom.h3.value, 10) || 3,
        h4: parseInt(this.dom.h4.value, 10) || 4,
        i1: this.dom.i1.value.trim(),
        i2: this.dom.i2.value.trim()
      }
    };
    store.setSettings(settings);
    this.updateExportOutput(store.getState());
  }

  handleConvert() {
    this.syncSettingsFromDom();
    const state = store.getState();
    const defaultName = this.dom.name.value.trim() || 'Config-1';

    let parsedConfigs = [];
    let parsingErrors = [];
    let detectedType = 'manual';

    if (state.mode === 'paste') {
      const rawInput = this.dom.inputData.value.trim();
      if (!rawInput) {
        store.setStatus('warn', 'Input area is empty. Please paste your proxy links or INI text first.');
        return;
      }

      const parseResult = parseAllInputs(rawInput, defaultName);
      parsedConfigs = parseResult.configs;
      parsingErrors = parseResult.errors;
      detectedType = parseResult.detectedType;
    } else {

      const privKey = this.dom.manualPrivate.value.trim();
      const pubKey = this.dom.manualPublic.value.trim();
      const endpointStr = this.dom.manualEndpoint.value.trim();
      const addresses = [this.dom.manualAddress.value.trim() || '172.16.0.2/32'];
      const ipv6 = this.dom.manualIPv6.value.trim();
      if (ipv6) addresses.push(ipv6);

      const psk = this.dom.manualPSK.value.trim() || null;
      const allowedIPs = this.dom.manualAllowed.value.split(',').map(s => s.trim()).filter(Boolean);
      const keepalive = parseInt(this.dom.manualKeepalive.value, 10) || 25;

      const manualWg = createWireguardModel({
        metadata: { name: defaultName, source: 'manual' },
        interface: {
          privateKey: privKey,
          addresses,
          dns: [state.settings.dns],
          mtu: state.settings.mtu
        },
        peer: {
          publicKey: pubKey,
          endpoint: { host: endpointStr, port: 51820 },
          allowedIPs: allowedIPs.length > 0 ? allowedIPs : ['0.0.0.0/0', '::/0'],
          persistentKeepalive: keepalive,
          presharedKey: psk
        },
        amnezia: { ...state.settings.awg }
      });

      if (endpointStr.includes(':')) {
        const lastColon = endpointStr.lastIndexOf(':');
        const h = endpointStr.slice(0, lastColon).replace(/[\[\]]/g, '');
        const p = parseInt(endpointStr.slice(lastColon + 1), 10);
        if (!isNaN(p)) {
          manualWg.peers[0].endpoint = { host: h, port: p };
        }
      }

      parsedConfigs.push(manualWg);
    }

    if (parsedConfigs.length === 0) {
      store.setStatus('error', 'Could not parse any valid configuration from the provided input.', parsingErrors);
      store.setConfigs([]);
      store.setReport(null);
      return;
    }

    const validationErrors = [];
    const validationWarnings = [];
    parsedConfigs.forEach((c, idx) => {
      const v = validateNormalizedModel(c);
      if (!v.valid) {
        v.errors.forEach(e => validationErrors.push(`[${c.metadata.name}] ${e}`));
      }
      if (v.warnings.length > 0) {
        v.warnings.forEach(w => validationWarnings.push(`[${c.metadata.name}] ${w}`));
      }
    });

    store.setConfigs(parsedConfigs);

    this.recalculateReport(parsedConfigs, parsingErrors.length + parsedConfigs.length);

    if (validationErrors.length > 0) {
      store.setStatus('warn', `Parsed ${parsedConfigs.length} configuration(s) with validation warnings:`, [
        ...validationErrors,
        ...parsingErrors
      ]);
    } else {
      const msgs = [`Detected format: ${detectedType}`];
      if (validationWarnings.length > 0) msgs.push(...validationWarnings);
      if (parsingErrors.length > 0) msgs.push(...parsingErrors);
      store.setStatus('success', `Successfully processed ${parsedConfigs.length} configuration(s)`, msgs);
    }
  }

  recalculateReport(configs = store.getState().configs, inputCount = null) {
    if (!configs || configs.length === 0) {
      store.setReport(null);
      return;
    }

    const state = store.getState();
    const target = state.currentTab;

    let overallLevel = 'exact';
    const allPreserved = new Set();
    const allUnsupported = new Set();
    const allWarnings = new Set();

    configs.forEach(c => {
      const comp = checkCompatibility(c, target);
      comp.preserved.forEach(p => allPreserved.add(p));
      comp.unsupported.forEach(u => allUnsupported.add(u));
      comp.warnings.forEach(w => allWarnings.add(w));

      if (comp.level === 'unsupported') {
        overallLevel = 'unsupported';
      } else if (comp.level === 'partial' && overallLevel !== 'unsupported') {
        overallLevel = 'partial';
      } else if (comp.level === 'compatible' && overallLevel === 'exact') {
        overallLevel = 'compatible';
      }
    });

    const report = {
      inputCount: inputCount || configs.length,
      parsedCount: configs.length,
      exportedCount: overallLevel === 'unsupported' ? 0 : configs.length,
      target,
      level: overallLevel,
      preserved: Array.from(allPreserved),
      unsupported: Array.from(allUnsupported),
      warnings: Array.from(allWarnings)
    };

    store.setReport(report);
  }

  updateExportOutput(state) {
    const configs = state.configs;
    const tab = state.currentTab;
    const settings = state.settings;

    let output = '';
    if (!configs || configs.length === 0) {
      this.dom.resultArea.value = '';
      return;
    }

    switch (tab) {
      case 'clash':
        output = buildClashConfig(configs, settings);
        break;
      case 'singbox':
        output = JSON.stringify(buildSingBoxConfig(configs, settings), null, 2);
        break;
      case 'json':
        output = JSON.stringify(buildXrayJsonConfig(configs, settings), null, 2);
        break;
      case 'amnezia': {
        const wg = configs.find(c => c.protocol === 'wireguard');
        output = wg
          ? buildAmneziaWG(wg, settings)
          : '# AmneziaWG export is only available for WireGuard configurations.\n# Please select Clash Meta, Sing-Box, or Xray JSON for VLESS/VMess/Trojan proxies.';
        break;
      }
      default:
        output = '';
    }

    this.dom.resultArea.value = output;
  }

  async handleCopyResult() {
    const text = this.dom.resultArea.value;
    const res = await copyText(text);
    if (res.success) {
      store.setStatus('success', 'Combined configuration copied to clipboard.');
    } else {
      store.setStatus('error', `Failed to copy: ${res.error}`);
    }
  }

  async handleCopyAllLinks() {
    const configs = store.getState().configs;
    if (!configs || configs.length === 0) {
      store.setStatus('warn', 'No configurations available to copy.');
      return;
    }

    const links = configs.map(c => {
      if (c.protocol === 'wireguard') {
        return buildAmneziaWG(c, store.getState().settings);
      }
      return c.original?.raw || JSON.stringify(c, null, 2);
    }).join('\n\n');

    const res = await copyText(links);
    if (res.success) {
      store.setStatus('success', `Copied ${configs.length} link(s) to clipboard.`);
    } else {
      store.setStatus('error', `Failed to copy: ${res.error}`);
    }
  }

  handleDownload() {
    const content = this.dom.resultArea.value;
    if (!content) {
      store.setStatus('warn', 'Nothing to download. Please parse a configuration first.');
      return;
    }

    const tab = store.getState().currentTab;
    const ext = tab === 'clash' ? 'yaml' : (tab === 'amnezia' ? 'conf' : 'json');
    const mime = tab === 'clash' ? 'text/yaml' : (tab === 'amnezia' ? 'text/plain' : 'application/json');
    const filename = `converted-${tab}.${ext}`;

    const res = downloadFile(content, filename, mime);
    if (res.success) {
      store.setStatus('info', `Downloaded ${filename}`);
    } else {
      store.setStatus('error', `Download failed: ${res.error}`);
    }
  }

  toggleQr() {
    const wrapper = this.dom.qrWrapper;
    wrapper.classList.toggle('active');
    if (wrapper.classList.contains('active')) {
      this.generateQr();
    }
  }

  generateQr() {
    const text = this.dom.resultArea.value;
    renderQrCode(this.dom.qrBox, this.dom.qrError, text, {
      width: 220,
      height: 220
    });
  }

  async handleFetchSubscription() {
    const url = this.dom.inputData.value.trim();
    const log = this.dom.fetchLog;
    log.innerHTML = '';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      log.innerHTML = `<span style="color:var(--status-error);display:inline-flex;align-items:center;gap:4px;">${renderIcon('alert-triangle', { size: 14 })} Please enter a valid HTTP or HTTPS subscription URL.</span>`;
      return;
    }

    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/i.test(url)) {
      log.innerHTML = `<span style="color:var(--status-error);display:inline-flex;align-items:center;gap:4px;">${renderIcon('alert-triangle', { size: 14 })} Fetching from localhost, private, or link-local IP addresses is blocked for security.</span>`;
      return;
    }

    log.innerHTML = `<span style="color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;">${renderIcon('refresh-cw', { size: 14, className: 'spin' })} Fetching subscription... (CORS policy applies)</span>`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const text = await res.text();

      if (text.length > 5 * 1024 * 1024) {
        throw new Error('Subscription content exceeds 5MB size limit.');
      }

      this.dom.inputData.value = text;
      log.innerHTML = `<span style="color:var(--status-success);display:inline-flex;align-items:center;gap:4px;">${renderIcon('check-circle-2', { size: 14 })} Subscription fetched successfully! Click "Parse / Refresh" below.</span>`;
      store.setStatus('success', 'Subscription loaded into input. Click "Parse / Refresh" to process.');
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'Request timed out after 12s' : err.message;
      log.innerHTML = `<span style="color:var(--status-error);display:inline-flex;align-items:center;gap:4px;">${renderIcon('x-circle', { size: 14 })} Fetch failed: ${msg}. (Note: Browser-side CORS restrictions block servers that do not send Access-Control-Allow-Origin).</span>`;
    }
  }

  handleClear() {
    this.dom.inputData.value = '';
    this.dom.resultArea.value = '';
    this.dom.fetchLog.textContent = '';
    this.dom.qrBox.innerHTML = '';
    this.dom.qrError.textContent = '';
    store.setConfigs([]);
    store.clearStatus();
    store.setReport(null);
  }
}
