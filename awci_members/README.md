# AWCI Member Directory Scraper — Setup & Usage

## Overview

The AWCI portal (`awci.my.site.com`) is a **Salesforce Experience Cloud** site.
All data loads through Salesforce's proprietary **Aura framework** via encrypted
JSON-over-HTTP POST calls — not static HTML. Two tools are provided:

| File | Purpose |
|------|---------|
| `aura_sniffer.js` | Paste into browser console → captures live API details |
| `awci_scraper.py` | Playwright auto-scraper (recommended) |
| `awci_direct_api.py` | Lightweight HTTP scraper (use after sniffer run) |

---

## Option A — Playwright Auto-Scraper (Recommended)

### 1. Install dependencies

```bash
pip install playwright
playwright install chromium
```

### 2. Run

```bash
python awci_scraper.py
```

The script will:
- Launch a headless Chromium browser
- Navigate to the AWCI directory
- Intercept all Aura API calls automatically
- Paginate through every page
- (Optionally) fetch each member's detail record
- Write `awci_output/awci_members.json` and `awci_output/awci_members.csv`

### Troubleshooting

**"Timed out waiting for Aura context"**  
The directory may require login. Edit `awci_scraper.py` line near
`pw.chromium.launch(headless=True)` and change to `headless=False`.
Log in manually, then the script will continue automatically.

**"No members extracted"**  
Check `awci_output/debug_responses.json` — it will contain the raw
Aura responses so you can inspect the actual field names and adapt
`normalize_member()` accordingly.

---

## Option B — Browser Sniffer + Direct API Scraper

Use this if Playwright fails or you want a simpler HTTP-only approach.

### Step 1 — Capture API details in your browser

1. Open Chrome/Firefox and go to:  
   `https://awci.my.site.com/portal/s/searchdirectory?id=a2n8W000002uXpI`
2. Open **DevTools** → **Console** tab  
3. Paste the entire contents of `aura_sniffer.js` and press **Enter**
4. Interact with the directory:
   - Leave the search blank and click **Search**
   - Scroll to a second page of results
   - (Optional) click around filters if needed
5. The console will print JSON blocks like:

```
[AURA POST] https://awci.my.site.com/portal/s/sfsites/aura?r=...
  pageURI:  /portal/s/searchdirectory
  actions:  [{"id":"1;a","descriptor":"apex://MemberDir...","params":{...}}]
  ── Full aura.context (copy this) ──
  {"mode":"PROD","fwuid":"abc123...","app":"siteforce:communityApp",...}

[AURA RESPONSE] apex://DRCTS.TableViewController/ACTION$fetchPaginationRecs  state=SUCCESS
  First record sample: {"Id":"001...","Name":"Company Name",...}
```

### Step 2 — Fill in `awci_direct_api.py`

Open `awci_direct_api.py` and update:

```python
AURA_CONTEXT      = '{"mode":"PROD","fwuid":"abc123...",...}'  # from sniffer
AURA_TOKEN        = "null"                                      # or JWT string
SEARCH_DESCRIPTOR = "apex://DRCTS.TableViewController/ACTION$fetchPaginationRecs"
DETAIL_DESCRIPTOR = ""  # optional
```

### Step 3 — Run

```bash
pip install requests
python awci_direct_api.py
```

---

## Output Files

Both scripts produce the same output in `./awci_output/`:

### `awci_members.json`
```json
[
  {
    "id": "a2n8W000002uXpI",
    "name": "John Smith",
    "first_name": "John",
    "last_name": "Smith",
    "company": "Smith Watch Repair",
    "title": "Master Watchmaker",
    "email": "john@smithwatchrepair.com",
    "phone": "(555) 123-4567",
    "address_street": "123 Main St",
    "address_city": "Springfield",
    "address_state": "IL",
    "address_zip": "62701",
    "address_country": "US",
    "website": "https://smithwatchrepair.com",
    "member_type": "Professional",
    "member_since": "2010-06-15",
    "certifications": "CW21; CMW",
    "specialties": "Antique Pocket Watches; Swiss Movements",
    "bio": "...",
    "photo_url": "https://...",
    "profile_url": "https://awci.my.site.com/portal/s/searchdirectory?id=a2n8W000002uXpI"
  },
  ...
]
```

### `awci_members.csv`
Standard CSV with the same fields as column headers.

---

## Notes

- The Aura `fwuid` (framework UID) may rotate between deployments.
  If you get auth errors weeks later, re-run the sniffer to refresh `AURA_CONTEXT`.
- For very large directories (1000+ members), add `time.sleep(0.5)` between
  calls (already included) to avoid rate limiting.
- If the portal requires authentication, log in once in the Playwright browser
  window — session cookies are automatically reused for all API calls.
