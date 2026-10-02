import { escapeHtml } from '../utils/escaping.js';
import { renderIcon } from '../utils/icons.js';

export function renderConversionReport(containerEl, report) {
  if (!containerEl) return;

  if (!report) {
    containerEl.className = 'conversion-report hidden';
    containerEl.innerHTML = '';
    return;
  }

  containerEl.className = 'conversion-report';

  const {
    inputCount = 0,
    parsedCount = 0,
    exportedCount = 0,
    target = '',
    level = 'exact',
    preserved = [],
    unsupported = [],
    warnings = []
  } = report;

  const levelBadgeClass = `level-${level}`;

  let html = `
    <div class="report-header">
      <span>Conversion Report & Compatibility</span>
      <span class="level-badge ${levelBadgeClass}">${escapeHtml(level)}</span>
    </div>
    <div class="report-stats">
      <div class="report-stat-item">
        <span class="stat-label">Input</span>
        <span class="stat-value">${inputCount}</span>
      </div>
      <div class="report-stat-item">
        <span class="stat-label">Parsed</span>
        <span class="stat-value" style="color:var(--status-success);">${parsedCount}</span>
      </div>
      <div class="report-stat-item">
        <span class="stat-label">Exported</span>
        <span class="stat-value" style="color:var(--primary);">${exportedCount}</span>
      </div>
      <div class="report-stat-item">
        <span class="stat-label">Warnings</span>
        <span class="stat-value" style="color:${warnings.length > 0 ? 'var(--status-warn)' : 'var(--text-muted)'};">${warnings.length}</span>
      </div>
      <div class="report-stat-item">
        <span class="stat-label">Unsupported</span>
        <span class="stat-value" style="color:${unsupported.length > 0 ? 'var(--status-error)' : 'var(--text-muted)'};">${unsupported.length}</span>
      </div>
    </div>
  `;

  if (unsupported.length > 0 || warnings.length > 0 || preserved.length > 0) {
    html += '<ul class="report-detail-list">';

    const iconError = renderIcon('x-circle', { size: 14 });
    const iconWarn = renderIcon('alert-triangle', { size: 14 });
    const iconSuccess = renderIcon('check-circle-2', { size: 14 });

    unsupported.forEach(item => {
      html += `<li class="report-detail-item" style="color:var(--status-error);">${iconError}<span><strong>Unsupported:</strong> ${escapeHtml(item)}</span></li>`;
    });

    warnings.forEach(item => {
      html += `<li class="report-detail-item" style="color:var(--status-warn);">${iconWarn}<span>${escapeHtml(item)}</span></li>`;
    });

    if (preserved.length > 0) {
      html += `<li class="report-detail-item" style="color:var(--status-success);">${iconSuccess}<span><strong>Preserved:</strong> ${escapeHtml(preserved.slice(0, 8).join(', '))}${preserved.length > 8 ? ` (+${preserved.length - 8} more)` : ''}</span></li>`;
    }

    html += '</ul>';
  }

  containerEl.innerHTML = html;
}
