/**
 * Parsed Configurations List Renderer
 */

import { escapeHtml } from '../utils/escaping.js';
import { buildAmneziaWG } from '../exporters/amnezia.js';

export function renderConfigList(containerEl, configs, options = {}) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  if (!Array.isArray(configs) || configs.length === 0) {
    containerEl.innerHTML = `
      <div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12.5px;">
        No configurations parsed yet. Paste configuration links, JSON, or INI on the left.
      </div>
    `;
    return;
  }

  const allExpanded = options.allExpanded ?? false;

  configs.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'config-item';

    const badgeClass = `badge-${item.protocol}`;
    const outputText = item.protocol === 'wireguard'
      ? buildAmneziaWG(item, options.settings || {})
      : (item.original?.raw || JSON.stringify(item, null, 2));

    const isOpen = allExpanded || false;

    itemDiv.innerHTML = `
      <button type="button" class="config-summary" id="config-summary-${index}" aria-expanded="${isOpen}" aria-controls="details-${index}">
        <div class="config-info">
          <span class="badge ${badgeClass}">${escapeHtml(item.protocol)}</span>
          <span class="config-title">${escapeHtml(item.metadata.name)}</span>
        </div>
        <span style="font-size:11px;color:var(--text-muted);">${item.server?.address ? `${escapeHtml(item.server.address)}:${item.server.port}` : (item.peers?.[0]?.endpoint?.host || 'WireGuard')}</span>
      </button>
      <div class="config-details ${isOpen ? 'open' : ''}" id="details-${index}" role="region" aria-labelledby="config-summary-${index}">
        <textarea class="item-output" readonly aria-label="Original or internal representation for ${escapeHtml(item.metadata.name)}">${escapeHtml(outputText)}</textarea>
      </div>
    `;

    const summaryBtn = itemDiv.querySelector('.config-summary');
    const detailsDiv = itemDiv.querySelector('.config-details');

    summaryBtn.addEventListener('click', () => {
      const willOpen = !detailsDiv.classList.contains('open');
      detailsDiv.classList.toggle('open', willOpen);
      summaryBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    containerEl.appendChild(itemDiv);
  });
}
