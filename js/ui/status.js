/**
 * Status Notifications Banner Component
 */

import { escapeHtml } from '../utils/escaping.js';

export function renderStatus(bannerEl, statusState) {
  if (!bannerEl) return;

  if (!statusState || !statusState.visible) {
    bannerEl.className = 'status-banner';
    bannerEl.innerHTML = '';
    return;
  }

  const { type, message, details } = statusState;
  bannerEl.className = `status-banner visible ${type}`;

  const iconMap = {
    success: '✓',
    warn: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  const icon = iconMap[type] || 'ℹ';
  let html = `<div style="font-weight:600;display:flex;align-items:center;gap:6px;"><span>${icon}</span><span>${escapeHtml(message)}</span></div>`;

  if (Array.isArray(details) && details.length > 0) {
    html += '<ul style="margin-top:6px;padding-left:18px;font-size:12px;list-style:disc;">';
    details.forEach(item => {
      html += `<li>${escapeHtml(item)}</li>`;
    });
    html += '</ul>';
  }

  bannerEl.innerHTML = html;
}
