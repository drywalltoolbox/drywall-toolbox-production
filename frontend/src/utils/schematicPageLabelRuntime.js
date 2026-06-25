const SCHEMATIC_PAGE_LABELS = {
  'tapetech-07tt': {
    1: 'Main Body',
    2: 'Head Assembly',
    3: 'Gooser Assembly',
    4: 'Lock Block',
  },
  'tapetech-maxxbox-ehc': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
  },
  'tapetech-easyclean-finishing-box': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
    4: '15 in.',
  },
  'tapetech-power-assist-maxxbox': {
    1: '7 in.',
    2: '10 in.',
    3: '12 in.',
  },
  'tapetech-quickbox-qsx': {
    1: '6 in.',
    2: '8 in.',
  },
};

function currentSchematicId() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('schematic') || '';
}

function normalizePageLabelBar() {
  if (typeof document === 'undefined') return;

  const schematicId = currentSchematicId();
  const labels = SCHEMATIC_PAGE_LABELS[schematicId];
  if (!labels) return;

  const pageBar = document.querySelector('.schematic-variant-bar[aria-label="Schematic page selector"]');
  if (!pageBar) return;

  const buttons = Array.from(pageBar.querySelectorAll('.schematic-variant-pill'));
  if (buttons.length === 0) return;

  let activePage = 1;

  buttons.forEach((button, index) => {
    const pageNumber = index + 1;
    const label = labels[pageNumber];
    const labelNode = button.querySelector('.schematic-variant-pill__label');

    if (label && labelNode && labelNode.textContent !== label) {
      labelNode.textContent = label;
    }

    if (button.getAttribute('aria-selected') === 'true') {
      activePage = pageNumber;
    }
  });

  const summaryValue = pageBar.querySelector('.schematic-variant-bar__value');
  const activeLabel = labels[activePage];
  if (summaryValue && activeLabel && summaryValue.textContent !== activeLabel) {
    summaryValue.textContent = activeLabel;
  }
}

function scheduleNormalize() {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(normalizePageLabelBar);
}

function patchHistoryMethod(methodName) {
  const original = window.history?.[methodName];
  if (typeof original !== 'function') return;

  window.history[methodName] = function patchedHistoryMethod(...args) {
    const result = original.apply(this, args);
    scheduleNormalize();
    return result;
  };
}

export function installSchematicPageLabelRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DTB_SCHEMATIC_PAGE_LABEL_RUNTIME__) return;
  window.__DTB_SCHEMATIC_PAGE_LABEL_RUNTIME__ = true;

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', scheduleNormalize);

  const observer = new MutationObserver(scheduleNormalize);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-selected'],
  });

  scheduleNormalize();
}
