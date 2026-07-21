# Drywall Toolbox

Drywall Toolbox is a headless ecommerce website for professional drywall contractors.

The storefront is a React app, backed by WordPress + WooCommerce APIs and custom backend modules for catalog, schematics, repairs, rewards, and operations workflows.

This repository is the internal workspace that powers and maintains the launch deployment at `elliottm4.sg-host.com`.

Canonical source lives in `frontend/` and `drywalltoolbox/wp/wp-content/mu-plugins/`. The generated, runtime-safe SiteGround overlay is assembled under `launch/live/`; WordPress core, regular plugins, uploads, caches, logs, and secrets remain server-owned and are never deployment source.
