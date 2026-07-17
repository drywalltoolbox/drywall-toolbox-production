# Archived Checkout Mobile CSS

These files were removed from the active frontend import path when mobile
checkout styling was consolidated into:

`frontend/src/features/checkout/checkout-mobile-screen-flow.css`

They are retained only as historical design/reference material. Do not import
them back into `frontend/src/main.jsx` as fallback or polish layers; doing so
reintroduces conflicting cascade authority for the mobile checkout bottom sheet,
step shell, payment logo rail, and review-only controls.
