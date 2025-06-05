// ui.ts - Import SVGs and create UI logic
import aiIcon from './icons/ai.svg';
import digipayIcon from './icons/digipay.svg';
import fidiboIcon from './icons/fidibo.svg';
import freshIcon from './icons/fresh.svg';
import goldIcon from './icons/gold.svg';
import jetIcon from './icons/jet.svg';
import magnetIcon from './icons/magnet.svg';
import mehrIcon from './icons/mehr.svg';
import pharmacyIcon from './icons/pharmacy.svg';
import plusIcon from './icons/plus.svg';
import sellerIcon from './icons/seller.svg';
import shopNewIcon from './icons/shop-new.svg';
import shopIcon from './icons/shop.svg';

// Webpack auto-converts SVGs to base64 data URIs
const logoConfig: Record<string, string> = {
  "Shop": shopIcon,
  "Shop New": shopNewIcon,
  "Seller": sellerIcon,
  "Plus": plusIcon,
  "AI": aiIcon,
  "Gold": goldIcon,
  "Fresh": freshIcon,
  "Pharmacy": pharmacyIcon,
  "Jet": jetIcon,
  "Fidibo": fidiboIcon,
  "Digipay": digipayIcon,
  "Mehr": mehrIcon,
  "Magnet": magnetIcon
};

// UI Elements
const loadingDiv = document.getElementById('loading') as HTMLElement;
const contentDiv = document.getElementById('content') as HTMLElement;
const noCollectionsDiv = document.getElementById('no-collections') as HTMLElement;
const dropdownButton = document.getElementById('dropdown-button') as HTMLButtonElement;
const dropdownMenu = document.getElementById('dropdown-menu') as HTMLElement;
const selectedContent = document.getElementById('selected-content') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const cancelButton = document.getElementById('cancel') as HTMLButtonElement;
const applyButton = document.getElementById('apply-mode') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLElement;

// State variables
let selectedMode: string | null = null;
let allOptions: string[] = [];
let filteredOptions: string[] = [];
let highlightedIndex = -1;
let isSearchMode = false;

function showContent() {
  loadingDiv.style.display = 'none';
  contentDiv.style.display = 'block';
}

function initializeDropdown() {
  allOptions = [
    'Shop', 'Shop New', 'Seller', 'Plus', 'AI', 'Gold',
    'Fresh', 'Pharmacy', 'Jet', 'Fidibo', 'Digipay', 'Mehr', 'Magnet'
  ];
  
  filteredOptions = allOptions.slice();
  renderDropdownItems();
}

function renderDropdownItems() {
  dropdownMenu.innerHTML = '';
  
  for (let i = 0; i < filteredOptions.length; i++) {
    const option = filteredOptions[i];
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    if (i === highlightedIndex) {
      item.className += ' highlighted';
    }
    item.setAttribute('data-value', option);
    
    const icon = logoConfig[option] ? 
      `<img src="${logoConfig[option]}" class="dropdown-item-icon" alt="${option}" onerror="console.log('Image failed to load: ${option}')">` : 
      '<div class="dropdown-item-icon" style="width: 24px; height: 24px; background: #ddd; border-radius: 2px;"></div>';
    
    item.innerHTML = icon + `<span class="dropdown-item-text">${option}</span>`;
    
    item.addEventListener('click', () => {
      selectOption(option, logoConfig[option]);
    });
    
    dropdownMenu.appendChild(item);
  }
}

function filterOptions(searchTerm: string) {
  const term = searchTerm.toLowerCase();
  filteredOptions = allOptions.filter(option => 
    option.toLowerCase().indexOf(term) !== -1
  );
  highlightedIndex = filteredOptions.length > 0 ? 0 : -1;
  renderDropdownItems();
}

function selectOption(value: string, iconPath: string) {
  selectedMode = value;
  
  const actualIconPath = iconPath || logoConfig[value];
  const icon = actualIconPath ? 
    `<img src="${actualIconPath}" class="dropdown-selected-icon" alt="${value}" onerror="console.log('Selected image failed to load: ${value}')">` : 
    '<div class="dropdown-selected-icon" style="width: 24px; height: 24px; background: #ddd; border-radius: 2px;"></div>';
  
  selectedContent.innerHTML = icon + `<span>${value}</span>`;
  
  closeDropdown();
  updateApplyButton();
}

function openDropdown() {
  isSearchMode = true;
  dropdownButton.style.display = 'none';
  searchInput.style.display = 'block';
  searchInput.focus();
  searchInput.value = '';
  filteredOptions = allOptions.slice();
  highlightedIndex = -1;
  renderDropdownItems();
  dropdownMenu.classList.add('show');
}

function closeDropdown() {
  isSearchMode = false;
  dropdownButton.style.display = 'block';
  searchInput.style.display = 'none';
  dropdownMenu.classList.remove('show');
  highlightedIndex = -1;
}

function selectHighlightedItem() {
  if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
    const option = filteredOptions[highlightedIndex];
    selectOption(option, logoConfig[option]);
  }
}

function showStatus(message: string, type: string) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function updateApplyButton() {
  applyButton.disabled = !selectedMode;
}

// Event listeners
dropdownButton.addEventListener('click', (e) => {
  e.stopPropagation();
  openDropdown();
});

searchInput.addEventListener('input', (e) => {
  filterOptions((e.target as HTMLInputElement).value);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
    renderDropdownItems();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    renderDropdownItems();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectHighlightedItem();
  } else if (e.key === 'Escape') {
    closeDropdown();
  }
});

searchInput.addEventListener('blur', () => {
  setTimeout(() => {
    const isHoveringMenu = dropdownMenu.matches(':hover');
    if (!isHoveringMenu) {
      closeDropdown();
    }
  }, 150);
});

document.addEventListener('click', (e) => {
  let isClickInsideDropdown = false;
  let element = e.target as HTMLElement;
  while (element) {
    if (element.classList && element.classList.contains('custom-dropdown')) {
      isClickInsideDropdown = true;
      break;
    }
    element = element.parentElement as HTMLElement;
  }
  if (!isClickInsideDropdown) {
    closeDropdown();
  }
});

applyButton.addEventListener('click', () => {
  if (!selectedMode) return;
  
  applyButton.disabled = true;
  applyButton.textContent = 'Applying...';
  
  parent.postMessage({ 
    pluginMessage: { 
      type: 'apply-theme-mode',
      data: {
        selectedMode: selectedMode
      }
    } 
  }, '*');
});

cancelButton.addEventListener('click', () => {
  parent.postMessage({ 
    pluginMessage: { type: 'cancel' } 
  }, '*');
});

window.addEventListener('message', (event) => {
  const msg = event.data.pluginMessage;
  
  console.log('UI received message:', msg.type, msg.data);
  
  if (msg.type === 'collections-loaded') {
    console.log('Collections data:', msg.data);
    if (msg.data.length > 0) {
      showContent();
    } else {
      loadingDiv.style.display = 'none';
      noCollectionsDiv.style.display = 'block';
    }
  } else if (msg.type === 'success') {
    applyButton.disabled = false;
    applyButton.textContent = 'Apply';
    updateApplyButton();
  } else if (msg.type === 'error') {
    showStatus(msg.message, 'error');
    applyButton.disabled = false;
    applyButton.textContent = 'Apply';
    updateApplyButton();
  } else if (msg.type === 'config-error') {
    showStatus(msg.message, 'error');
  }
});

// Initialize when DOM is loaded
initializeDropdown();
showContent(); // Add this line to show the UI immediately