export function setupAnimatedDropdown(selectEl) {
  if (!selectEl || selectEl.dataset.customDropdownInit) return;
  selectEl.dataset.customDropdownInit = 'true';

  selectEl.classList.add('sr-select-hidden');

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-dropdown-wrapper';
  wrapper.setAttribute('data-state', 'closed');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-dropdown-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.id = `${selectEl.id || 'select'}-trigger`;

  const labelSpan = document.createElement('span');
  labelSpan.className = 'custom-dropdown-label';

  const chevron = document.createElement('span');
  chevron.className = 'custom-dropdown-chevron';
  chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

  trigger.appendChild(labelSpan);
  trigger.appendChild(chevron);

  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', trigger.id);

  let isOpen = false;

  const renderItems = () => {
    menu.innerHTML = '';
    const options = Array.from(selectEl.options);
    const selectedOption = selectEl.options[selectEl.selectedIndex] || options[0];
    labelSpan.textContent = selectedOption ? selectedOption.text : 'Select Option';

    options.forEach((opt, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'custom-dropdown-item';
      item.setAttribute('role', 'option');
      item.setAttribute('data-value', opt.value);
      item.style.setProperty('--stagger-index', idx);

      const isSelected = opt.value === selectEl.value;
      if (isSelected) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.setAttribute('aria-selected', 'false');
      }

      item.innerHTML = `
        <span class="item-text">${opt.text}</span>
        <span class="item-check" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
      `;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectOption(opt.value);
      });

      menu.appendChild(item);
    });
  };

  const openDropdown = () => {
    if (isOpen) return;
    isOpen = true;
    wrapper.setAttribute('data-state', 'open');
    trigger.setAttribute('aria-expanded', 'true');
    menu.classList.add('visible');

    const selectedItem = menu.querySelector('.custom-dropdown-item.selected') || menu.querySelector('.custom-dropdown-item');
    if (selectedItem) selectedItem.focus();
  };

  const closeDropdown = () => {
    if (!isOpen) return;
    isOpen = false;
    wrapper.setAttribute('data-state', 'closed');
    trigger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('visible');
    trigger.focus();
  };

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  const selectOption = (val) => {
    if (selectEl.value !== val) {
      selectEl.value = val;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    updateDisplay();
    closeDropdown();
  };

  const updateDisplay = () => {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    labelSpan.textContent = selectedOption ? selectedOption.text : 'Select Option';
    menu.querySelectorAll('.custom-dropdown-item').forEach(item => {
      const match = item.getAttribute('data-value') === selectEl.value;
      item.classList.toggle('selected', match);
      item.setAttribute('aria-selected', match ? 'true' : 'false');
    });
  };

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDropdown();
  });

  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else {
        const items = Array.from(menu.querySelectorAll('.custom-dropdown-item'));
        const activeIdx = items.indexOf(document.activeElement);
        const next = items[activeIdx + 1] || items[0];
        if (next) next.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else {
        const items = Array.from(menu.querySelectorAll('.custom-dropdown-item'));
        const activeIdx = items.indexOf(document.activeElement);
        const prev = items[activeIdx - 1] || items[items.length - 1];
        if (prev) prev.focus();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  const originalValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (originalValueSetter) {
    Object.defineProperty(selectEl, 'value', {
      set(val) {
        originalValueSetter.call(this, val);
        updateDisplay();
      },
      get() {
        return Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.get.call(this);
      },
      configurable: true
    });
  }

  selectEl.addEventListener('change', () => {
    updateDisplay();
  });

  const observer = new MutationObserver(() => {
    renderItems();
  });
  observer.observe(selectEl, { childList: true, subtree: true });

  renderItems();

  selectEl.parentNode.insertBefore(wrapper, selectEl);
  wrapper.appendChild(selectEl);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  return {
    wrapper,
    update: updateDisplay,
    render: renderItems
  };
}

export function setupAnimatedDropdowns() {
  document.querySelectorAll('select').forEach(select => {
    setupAnimatedDropdown(select);
  });
}
