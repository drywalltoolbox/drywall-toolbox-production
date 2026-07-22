import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../../styles/storefront-desktop-navigation.css';

function DesktopNavDropdown({ item, isOpen, active, onOpen, onClose, onNavigate }) {
  const triggerRef = useRef(null);
  const panelId = useId();

  const closeAndFocus = () => {
    onClose();
    triggerRef.current?.focus();
  };

  return (
    <div
      className={`dtb-desktop-nav-menu${isOpen ? ' is-open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`dtb-desktop-nav-tab${active ? ' is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          if (!isOpen) onOpen();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <span>{item.label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      <section
        id={panelId}
        className={`dtb-desktop-nav-dropdown dtb-desktop-nav-dropdown--${item.size || 'medium'}`}
        aria-label={`${item.label} navigation`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
          }
        }}
      >
        <div className="dtb-desktop-nav-dropdown__header">
          <p>{item.label}</p>
          <span>{item.description}</span>
        </div>
        <div className="dtb-desktop-nav-dropdown__scroller">
          <div className={`dtb-desktop-nav-dropdown__links${item.columns === 2 ? ' is-two-column' : ''}`}>
            {item.items.map((entry) => (
              <Link key={entry.to} to={entry.to} className="dtb-desktop-nav-dropdown__link" onClick={onNavigate}>
                <span>{entry.label}</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        <Link to={item.landingTo} className="dtb-desktop-nav-dropdown__footer" onClick={onNavigate}>
          <span>{item.landingLabel}</span>
          <ChevronRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default function StorefrontDesktopNavigation({ items, openMenuId, onOpen, onClose, onNavigate, isItemActive }) {
  return (
    <nav className="dtb-desktop-nav" aria-label="Primary navigation">
      {items.map((item) => item.items?.length ? (
        <DesktopNavDropdown
          key={item.id}
          item={item}
          isOpen={openMenuId === item.id}
          active={isItemActive(item)}
          onOpen={() => onOpen(item.id)}
          onClose={onClose}
          onNavigate={onNavigate}
        />
      ) : (
        <Link
          key={item.id}
          to={item.landingTo}
          className={`dtb-desktop-nav-tab${isItemActive(item) ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
