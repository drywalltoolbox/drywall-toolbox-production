(function () {
  'use strict';

  var menu;
  var menuWrap;
  var activeItem = null;

  function isDesktopAdminMenu() {
    return window.innerWidth >= 783 &&
      document.body.classList.contains('wp-admin') &&
      !document.body.classList.contains('folded');
  }

  function directSubmenu(item) {
    for (var i = 0; i < item.children.length; i += 1) {
      if (item.children[i].classList && item.children[i].classList.contains('wp-submenu')) {
        return item.children[i];
      }
    }

    return null;
  }

  function viewportTop() {
    var adminBar = document.getElementById('wpadminbar');
    if (!adminBar) return 0;

    return Math.max(0, Math.round(adminBar.getBoundingClientRect().bottom));
  }

  function positionFlyout(item) {
    if (!isDesktopAdminMenu() || !menuWrap || !item) return;

    var submenu = directSubmenu(item);
    if (!submenu) return;

    activeItem = item;
    item.classList.add('dtb-admin-menu-flyout-active');

    var itemRect = item.getBoundingClientRect();
    var wrapRect = menuWrap.getBoundingClientRect();
    var topMin = viewportTop();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    var preferredTop = Math.max(topMin, Math.round(itemRect.top));
    var submenuHeight = Math.max(submenu.scrollHeight || 0, submenu.offsetHeight || 0, 80);
    var availableBelow = Math.max(96, viewportHeight - preferredTop - 8);
    var maxHeight = Math.min(submenuHeight, Math.max(96, viewportHeight - topMin - 12));
    var top = preferredTop;

    if (submenuHeight > availableBelow) {
      top = Math.max(topMin + 4, viewportHeight - Math.min(submenuHeight, maxHeight) - 8);
    }

    item.style.setProperty('--dtb-admin-flyout-top', Math.round(top) + 'px');
    item.style.setProperty('--dtb-admin-flyout-left', Math.round(wrapRect.right) + 'px');
    item.style.setProperty('--dtb-admin-flyout-max-height', Math.round(maxHeight) + 'px');
  }

  function clearFlyout(item) {
    if (!item) return;

    item.classList.remove('dtb-admin-menu-flyout-active');
    item.style.removeProperty('--dtb-admin-flyout-top');
    item.style.removeProperty('--dtb-admin-flyout-left');
    item.style.removeProperty('--dtb-admin-flyout-max-height');
    if (activeItem === item) activeItem = null;
  }

  function closestMenuItem(target) {
    while (target && target !== menu) {
      if (target.tagName === 'LI' && target.classList.contains('wp-has-submenu')) {
        return target;
      }
      target = target.parentElement;
    }

    return null;
  }

  function init() {
    menu = document.getElementById('adminmenu');
    menuWrap = document.getElementById('adminmenuwrap');
    if (!menu || !menuWrap) return;

    menu.addEventListener('mouseover', function (event) {
      var item = closestMenuItem(event.target);
      if (!item || item === activeItem) return;
      if (activeItem) clearFlyout(activeItem);
      positionFlyout(item);
    });

    menu.addEventListener('focusin', function (event) {
      var item = closestMenuItem(event.target);
      if (!item || item === activeItem) return;
      if (activeItem) clearFlyout(activeItem);
      positionFlyout(item);
    });

    menu.addEventListener('mouseout', function (event) {
      var item = closestMenuItem(event.target);
      if (!item || item.contains(event.relatedTarget)) return;
      clearFlyout(item);
    });

    menu.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!menu.contains(document.activeElement) && activeItem) {
          clearFlyout(activeItem);
        }
      }, 0);
    });

    menuWrap.addEventListener('scroll', function () {
      if (activeItem) positionFlyout(activeItem);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (activeItem) positionFlyout(activeItem);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
