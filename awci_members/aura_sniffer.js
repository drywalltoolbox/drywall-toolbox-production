/**
 * AWCI Aura Endpoint Sniffer
 * ===========================
 * Paste the entire contents of this file into the Chrome/Firefox DevTools
 * console while on  https://awci.my.site.com/portal/s/searchdirectory
 *
 * It patches window.fetch so every Aura POST is logged with:
 *   - Full endpoint URL
 *   - aura.context  (copy this into the Python script)
 *   - aura.token
 *   - action descriptor strings
 *   - Raw returnValue from each action
 *
 * Usage
 * ------
 * 1. Open  https://awci.my.site.com/portal/s/searchdirectory  in Chrome
 * 2. Open DevTools → Console tab
 * 3. Paste this entire script and press Enter
 * 4. Interact with the directory (search, scroll to next page)
 * 5. Watch the console output — copy the printed JSON blobs
 * 6. Update awci_scraper.py with the captured descriptors & context
 */

(function () {
  "use strict";

  const _origFetch = window.fetch.bind(window);

  window.fetch = async function (...args) {
    const [resource, init = {}] = args;
    const url = typeof resource === "string" ? resource : resource.url;

    if (!url.includes("sfsites/aura")) {
      return _origFetch(...args);
    }

    // ── Decode the POST body ──────────────────────────────────────────
    const body = init.body || "";
    const params = Object.fromEntries(new URLSearchParams(body));

    let message   = {};
    let context   = {};
    let pageURI   = params["aura.pageURI"]  || "";
    let token     = params["aura.token"]    || "null";

    try { message = JSON.parse(params["message"]      || "{}"); } catch {}
    try { context = JSON.parse(params["aura.context"] || "{}"); } catch {}

    const actions = (message.actions || []).map(a => ({
      id:         a.id,
      descriptor: a.descriptor,
      params:     a.params,
    }));

    console.group("%c[AURA POST] " + url, "color:#0070d2;font-weight:bold");
    console.log("pageURI:", pageURI);
    console.log("token:", token);
    console.log("fwuid:", context.fwuid);
    console.log("actions:", JSON.stringify(actions, null, 2));
    console.log("\n── Full aura.context (copy this) ──\n", params["aura.context"]);
    console.groupEnd();

    // ── Make the real request and decode the response ─────────────────
    const response = await _origFetch(...args);
    const clone    = response.clone();

    clone.text().then(raw => {
      try {
        const clean = raw.replace(/^while\s*\(\s*1\s*\);?\s*/, "");
        const data  = JSON.parse(clean);
        (data.actions || []).forEach(action => {
          console.group(
            `%c[AURA RESPONSE] ${action.descriptor || "unknown"}  state=${action.state}`,
            "color:#2e844a;font-weight:bold"
          );
          const rv = action.returnValue;
          if (rv) {
            const keys = Object.keys(rv);
            console.log("returnValue keys:", keys);
            // Print record counts if detectable
            ["totalCount","total","totalSize","count"].forEach(k => {
              if (rv[k] !== undefined) console.log(`  ${k}:`, rv[k]);
            });
            // Print first record sample
            const list = rv.members || rv.records || rv.results || rv.data;
            if (Array.isArray(list) && list.length > 0) {
              console.log("  First record sample:", JSON.stringify(list[0], null, 2));
            }
          }
          console.groupEnd();
        });
      } catch (e) {
        console.warn("[AURA RESPONSE] Could not parse:", e.message);
      }
    });

    return response;
  };

  console.info(
    "%c[AWCI Sniffer] Active — interact with the directory to capture API calls.",
    "background:#0070d2;color:white;padding:4px 8px;border-radius:4px"
  );
})();
