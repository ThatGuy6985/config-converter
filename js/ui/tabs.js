export function setupAccessibleTabs(tablistEl, onTabSelect) {
  if (!tablistEl) return;

  const tabs = Array.from(tablistEl.querySelectorAll('[role="tab"]'));

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectTab(tabs, tab, onTabSelect);
    });

    tab.addEventListener('keydown', (e) => {
      let targetIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = tabs.length - 1;
      }

      if (targetIndex !== -1) {
        tabs[targetIndex].focus();
        selectTab(tabs, tabs[targetIndex], onTabSelect);
      }
    });
  });
}

function selectTab(tabs, activeTab, onTabSelect) {
  tabs.forEach(t => {
    const isSelected = t === activeTab;
    t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    t.classList.toggle('active', isSelected);
    if (isSelected) {
      t.removeAttribute('tabindex');
    } else {
      t.setAttribute('tabindex', '-1');
    }
  });

  const tabValue = activeTab.getAttribute('data-tab');
  if (onTabSelect && tabValue) {
    onTabSelect(tabValue);
  }
}
