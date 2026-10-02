import { escapeHtml } from '../utils/escaping.js';
import { renderIcon } from '../utils/icons.js';

export function renderStatus(bannerEl, statusState) {
  if (!bannerEl) return;

  if (!statusState || !statusState.visible) {
    bannerEl.className = 'status-banner';
    bannerEl.innerHTML = '';
    return;
  }

  const { type, message, details } = statusState;
  bannerEl.className = `status-banner visible ${type}`;

  const iconNameMap = {
    success: 'check-circle-2',
    warn: 'alert-triangle',
    error: 'x-circle',
    info: 'info'
  };

  const iconSvg = renderIcon(iconNameMap[type] || 'info', { size: 16 });
  let html = `<div style="font-weight:600;display:flex;align-items:center;gap:8px;">${iconSvg}<span>${escapeHtml(message)}</span></div>`;

  if (Array.isArray(details) && details.length > 0) {
    html += '<ul style="margin-top:6px;padding-left:18px;font-size:12px;list-style:disc;">';
    details.forEach(item => {
      html += `<li>${escapeHtml(item)}</li>`;
    });
    html += '</ul>';
  }

  bannerEl.innerHTML = html;
}
