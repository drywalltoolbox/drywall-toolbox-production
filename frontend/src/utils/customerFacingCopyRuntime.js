const CUSTOMER_FACING_COPY_REPLACEMENTS = [
  {
    from: 'How will the tool get to DTB?',
    to: 'How will the tool get to our repair center?',
  },
  {
    from: 'Ship to DTB with a label',
    to: 'Ship with a prepaid label',
  },
  {
    from: 'ship to DTB',
    to: 'ship to our repair center',
  },
  {
    from: 'Ship to DTB',
    to: 'Ship to our repair center',
  },
];

const CUSTOMER_FACING_COPY_ATTRIBUTE_NAMES = [
  'aria-label',
  'title',
  'placeholder',
  'alt',
];

function normalizeAppPath(pathname = '') {
  return String(pathname || '').replace(/^\/staging\/\d+(?=\/|$)/, '') || '/';
}

function shouldNormalizeCustomerCopy() {
  if (typeof window === 'undefined') return false;
  const path = normalizeAppPath(window.location.pathname);
  return path.startsWith('/repairs');
}

function applyCopyReplacements(value = '') {
  return CUSTOMER_FACING_COPY_REPLACEMENTS.reduce(
    (next, { from, to }) => next.split(from).join(to),
    String(value),
  );
}

function normalizeTextNode(node) {
  if (!node?.nodeValue) return;
  const nextValue = applyCopyReplacements(node.nodeValue);
  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
}

function normalizeElementAttributes(element) {
  if (!element?.getAttribute) return;

  CUSTOMER_FACING_COPY_ATTRIBUTE_NAMES.forEach((attributeName) => {
    const currentValue = element.getAttribute(attributeName);
    if (!currentValue) return;

    const nextValue = applyCopyReplacements(currentValue);
    if (nextValue !== currentValue) {
      element.setAttribute(attributeName, nextValue);
    }
  });
}

function normalizeCustomerFacingCopy(root = document.body) {
  if (!root || !shouldNormalizeCustomerCopy()) return;

  if (root.nodeType === Node.TEXT_NODE) {
    normalizeTextNode(root);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) {
    normalizeElementAttributes(root);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(current);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      normalizeElementAttributes(current);
    }
    current = walker.nextNode();
  }
}

export function installCustomerFacingCopyRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const run = () => normalizeCustomerFacingCopy(document.body);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    queueMicrotask(run);
  }

  const observer = new MutationObserver((mutations) => {
    if (!shouldNormalizeCustomerCopy()) return;

    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        normalizeTextNode(mutation.target);
        return;
      }

      mutation.addedNodes.forEach((node) => normalizeCustomerFacingCopy(node));

      if (mutation.type === 'attributes') {
        normalizeElementAttributes(mutation.target);
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: CUSTOMER_FACING_COPY_ATTRIBUTE_NAMES,
  });
}
