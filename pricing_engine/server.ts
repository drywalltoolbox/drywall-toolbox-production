import express, { NextFunction, Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { LocalDB } from "./server/db";
import { calibrateProductPrice } from "./server/engine";
import { Product, ScanLog, EquivalenceMapping } from "./src/types";
// @ts-ignore - cloudscraper has incomplete/unstable TS declarations in many projects.
import cloudscraper from "cloudscraper";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "50mb" }));

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const DEFAULT_MIN_MATCH_SCORE = Number(process.env.PRICING_MIN_MATCH_SCORE || 80);
const MAX_RESEARCH_MATCHES = Number(process.env.PRICING_MAX_RESEARCH_MATCHES || 8);
const VERIFY_TIMEOUT_MS = Number(process.env.PRICING_URL_VERIFY_TIMEOUT_MS || 12_000);
const HARD_REJECT_404 = String(process.env.PRICING_HARD_REJECT_404 || "false").toLowerCase() === "true";
const DEFAULT_IMPORT_MIN_MARGIN_PERCENT = Number(process.env.PRICING_DEFAULT_MIN_MARGIN_PERCENT || 35);

const apiKey = process.env.GEMINI_API_KEY;
const isApiKeyPlaceholder = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("PLACEHOLDER");

const ai = new GoogleGenAI({
  apiKey: isApiKeyPlaceholder ? undefined : apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "dtb-pricing-research/1.0"
    }
  }
});

type ResearchConfidence = "high" | "medium" | "low";
type UrlVerificationStatus = "reachable" | "blocked" | "not_found" | "invalid" | "timeout" | "network_error" | "unknown";

type UrlVerificationResult = {
  ok: boolean;
  status?: number;
  kind: UrlVerificationStatus;
  finalUrl?: string;
  error?: string;
  bodySignals?: string[];
};

type AiResearchMatch = {
  retailer: string;
  retailerDomain?: string | null;
  price: number;
  url: string;
  sku?: string | null;
  retailerSku?: string | null;
  retailerMpn?: string | null;
  productName: string;
  confidence: ResearchConfidence;
  matchScore?: number;
  explanation?: string;
  matchReasons?: string[];
  rejectionRisks?: string[];
  availability?: "in_stock" | "limited_stock" | "unknown" | "out_of_stock";
  isSingleUnit?: boolean;
  priceType?: "regular" | "sale" | "clearance" | "advertised" | "unknown";
};

type ResearchResult = {
  success: boolean;
  sku?: string;
  recordedMatches: number;
  pendingMappings: number;
  rejectedMatches: number;
  aiMatches: number;
  details: string[];
};

type ApiError = Error & { status?: number; expose?: boolean };

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncRoute = (handler: AsyncRoute) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeIdentifier(value: unknown): string {
  return normalizeWhitespace(value).toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function normalizeRetailerKey(value: unknown): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.(com|net|org|co|us|ca)$/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getHostname(inputUrl: string): string | null {
  try {
    return new URL(inputUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function coerceFiniteMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
      return Number(numeric.toFixed(2));
    }
  }

  return null;
}

function toConfidence(value: unknown): ResearchConfidence {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return "low";
}

function buildSearchQueries(product: Product): string[] {
  const sku = normalizeIdentifier(product.sku);
  const name = normalizeWhitespace(product.name);
  const brand = normalizeWhitespace((product as any).brand);
  const category = normalizeWhitespace((product as any).category);
  const upc = normalizeWhitespace((product as any).upc);

  const exactCatalogQuery = [sku, name].filter(Boolean).join(" ");

  const candidates = [
    exactCatalogQuery,
    [sku, brand, name].filter(Boolean).join(" "),
    [brand, sku, name].filter(Boolean).join(" "),
    [sku, brand].filter(Boolean).join(" "),
    [sku, category].filter(Boolean).join(" "),
    [brand, name].filter(Boolean).join(" "),
    [name, sku].filter(Boolean).join(" "),
    upc,
    sku,
    name
  ];

  return Array.from(new Set(candidates.map(normalizeWhitespace).filter(Boolean))).slice(0, 10);
}

function getPrimaryCatalogQuery(product: Product): string {
  return buildSearchQueries(product)[0] || [normalizeIdentifier(product.sku), normalizeWhitespace(product.name)].filter(Boolean).join(" ");
}
function buildIdentifierSet(product: Product): string[] {
  return Array.from(
    new Set([
      normalizeIdentifier(product.sku),
      normalizeIdentifier((product as any).upc)
    ].filter(Boolean))
  );
}

function hasCatalogSkuEvidence(product: Product, match: AiResearchMatch): boolean {
  const sku = normalizeIdentifier(product.sku);
  if (!sku || sku.length < 2) return false;

  const host = normalizeIdentifier(getHostname(match.url) || "");
  const urlPath = (() => {
    try {
      const parsed = new URL(match.url);
      return normalizeIdentifier(`${parsed.pathname} ${parsed.search}`);
    } catch {
      return "";
    }
  })();

  const evidenceBlob = [
    match.sku,
    match.retailerSku,
    match.productName,
    match.explanation,
    match.url,
    host,
    urlPath,
    ...(match.matchReasons || [])
  ]
    .map(normalizeIdentifier)
    .join(" ");

  return evidenceBlob.includes(sku);
}

function hasBrandNameEvidence(product: Product, match: AiResearchMatch): boolean {
  const brand = normalizeWhitespace((product as any).brand).toLowerCase();
  const productNameTokens = normalizeWhitespace(product.name)
    .toLowerCase()
    .replace(/[^a-z0-9"°.-]+/g, " ")
    .split(" ")
    .filter(token => token.length >= 3);

  const evidence = [
    match.productName,
    match.explanation,
    ...(match.matchReasons || [])
  ]
    .map(value => normalizeWhitespace(value).toLowerCase())
    .join(" ");

  const brandOk = !brand || evidence.includes(brand.replace(/ tools$/i, "")) || evidence.includes(brand);
  const meaningfulTokens = productNameTokens.filter(token => !["the", "and", "with", "for", "tool", "tools"].includes(token));
  const matchedTokens = meaningfulTokens.filter(token => evidence.includes(token));

  return brandOk && meaningfulTokens.length > 0 && matchedTokens.length / meaningfulTokens.length >= 0.45;
}
function hasIdentifierEvidence(product: Product, match: AiResearchMatch): boolean {
  const identifiers = buildIdentifierSet(product);
  const skuEvidence = hasCatalogSkuEvidence(product, match);
  if (skuEvidence) return true;

  if (identifiers.length === 0) return false;

  const evidenceBlob = [
    match.sku,
    match.retailerSku,
    match.productName,
    match.explanation,
    match.url,
    ...(match.matchReasons || [])
  ]
    .map(normalizeIdentifier)
    .join(" ");

  return identifiers.some(id => id.length >= 2 && evidenceBlob.includes(id));
}
function isPotentiallyValidUrl(inputUrl: unknown): inputUrl is string {
  if (typeof inputUrl !== "string") return false;
  try {
    const parsed = new URL(inputUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function detectBodySignals(body: unknown): string[] {
  const text = String(body ?? "").toLowerCase().slice(0, 50_000);
  const signals: string[] = [];

  const signalMap: Record<string, string[]> = {
    bot_challenge: ["cloudflare", "captcha", "security check", "access denied", "perimeterx", "datadome", "akamai", "bot detection"],
    not_found: ["404 not found", "page not found", "product not found", "this product is no longer available"],
    product_page: ["add to cart", "sku", "mpn", "price", "availability", "woocommerce", "shopify", "product"]
  };

  for (const [signal, needles] of Object.entries(signalMap)) {
    if (needles.some(needle => text.includes(needle))) signals.push(signal);
  }

  return signals;
}

async function verifyProductUrl(inputUrl: string): Promise<UrlVerificationResult> {
  if (!isPotentiallyValidUrl(inputUrl)) {
    return { ok: false, kind: "invalid", error: "Invalid URL format" };
  }

  const normalizedUrl = inputUrl.trim();

  try {
    const response = await cloudscraper.get({
      uri: normalizedUrl,
      resolveWithFullResponse: true,
      followAllRedirects: true,
      gzip: true,
      timeout: VERIFY_TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    const status = Number(response.statusCode || 0);
    const bodySignals = detectBodySignals(response.body);
    const finalUrl = response.request?.uri?.href || response.request?.href || normalizedUrl;

    if (status >= 200 && status < 400) {
      return { ok: true, status, kind: "reachable", finalUrl, bodySignals };
    }

    if ([401, 403, 429, 503].includes(status) || bodySignals.includes("bot_challenge")) {
      return { ok: true, status, kind: "blocked", finalUrl, bodySignals, error: `Retailer blocked verification with HTTP ${status}` };
    }

    if (status === 404) {
      const ok = !HARD_REJECT_404 && !bodySignals.includes("not_found");
      return { ok, status, kind: "not_found", finalUrl, bodySignals, error: "HTTP 404 during direct verification" };
    }

    return { ok: false, status, kind: "unknown", finalUrl, bodySignals, error: `Unexpected HTTP status ${status}` };
  } catch (err: any) {
    const status = Number(err?.statusCode || err?.response?.statusCode || 0) || undefined;
    const bodySignals = detectBodySignals(err?.response?.body);
    const message = String(err?.message || err || "URL verification failed");

    if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("timed out")) {
      return { ok: true, status, kind: "timeout", bodySignals, error: message };
    }

    if (status && [401, 403, 429, 503].includes(status)) {
      return { ok: true, status, kind: "blocked", bodySignals, error: message };
    }

    if (status === 404) {
      const isExplicitNotFound = bodySignals.includes("not_found");
      return {
        ok: !HARD_REJECT_404 && !isExplicitNotFound,
        status,
        kind: "not_found",
        bodySignals,
        error: message
      };
    }

    return { ok: false, status, kind: "network_error", bodySignals, error: message };
  }
}

function findConfiguredCompetitor(match: AiResearchMatch, competitors: any[]): any | undefined {
  const retailerKey = normalizeRetailerKey(match.retailer);
  const domainKey = normalizeRetailerKey(match.retailerDomain || getHostname(match.url) || "");

  return competitors.find(c => {
    if (!c?.active) return false;
    const nameKey = normalizeRetailerKey(c.name);
    const websiteKey = normalizeRetailerKey(c.website || "");

    return (
      retailerKey === nameKey ||
      retailerKey.includes(nameKey) ||
      nameKey.includes(retailerKey) ||
      (!!domainKey && !!websiteKey && (domainKey.includes(websiteKey) || websiteKey.includes(domainKey)))
    );
  });
}

function resolveCompetitorName(match: AiResearchMatch, configuredCompetitor?: any): string {
  if (configuredCompetitor?.name) return configuredCompetitor.name;
  const domain = match.retailerDomain || getHostname(match.url);
  return normalizeWhitespace(match.retailer || domain || "Unknown Retailer");
}

function normalizeAiMatches(raw: unknown): AiResearchMatch[] {
  const payload = raw as any;
  const rawMatches = Array.isArray(payload?.matches) ? payload.matches : [];

  return rawMatches
    .map((item: any): AiResearchMatch | null => {
      const price = coerceFiniteMoney(item?.price);
      const url = normalizeWhitespace(item?.url);
      const productName = normalizeWhitespace(item?.productName || item?.title || item?.name);
      const retailer = normalizeWhitespace(item?.retailer || item?.merchant || getHostname(url));

      if (!price || !isPotentiallyValidUrl(url) || !productName || !retailer) return null;

      return {
        retailer,
        retailerDomain: normalizeWhitespace(item?.retailerDomain || getHostname(url)) || null,
        price,
        url,
        sku: item?.sku ? normalizeWhitespace(item.sku) : null,
        retailerSku: item?.retailerSku ? normalizeWhitespace(item.retailerSku) : item?.sku ? normalizeWhitespace(item.sku) : null,
        retailerMpn: item?.retailerMpn ? normalizeWhitespace(item.retailerMpn) : null,
        productName,
        confidence: toConfidence(item?.confidence || item?.matchConfidence),
        matchScore: Number.isFinite(Number(item?.matchScore)) ? Number(item.matchScore) : undefined,
        explanation: normalizeWhitespace(item?.explanation),
        matchReasons: Array.isArray(item?.matchReasons) ? item.matchReasons.map(normalizeWhitespace).filter(Boolean) : [],
        rejectionRisks: Array.isArray(item?.rejectionRisks) ? item.rejectionRisks.map(normalizeWhitespace).filter(Boolean) : [],
        availability: item?.availability || "unknown",
        isSingleUnit: item?.isSingleUnit !== false,
        priceType: item?.priceType || "unknown"
      };
    })
    .filter(Boolean)
    .slice(0, MAX_RESEARCH_MATCHES) as AiResearchMatch[];
}

function buildScanPrompt(product: Product): string {
  const queries = buildSearchQueries(product);
  const primaryQuery = getPrimaryCatalogQuery(product);

  return `You are a production-grade retail pricing research agent for Drywall Toolbox.

MISSION
Find active, truthful, single-unit USD retail prices for the exact target product from distinct real retailers or distributors on the public web.

IMPORTANT CATALOG REALITY
The imported CSV catalog does NOT contain manufacturer part numbers / MPN values.
Do not require MPN evidence.
Do not reject a listing only because MPN is absent.
The authoritative primary identity key is the imported catalog pair:
SKU + product name.

TARGET PRODUCT
- Brand: ${(product as any).brand || "Unknown"}
- SKU: ${product.sku}
- Name: ${product.name}
- Category: ${(product as any).category || "Unknown"}
- UPC: ${(product as any).upc || "Unknown"}

MANDATORY PRIMARY GOOGLE SEARCH
You MUST begin with this exact Google Search query generated from the imported CSV:
"${primaryQuery}"

This query must be treated as the highest-priority discovery path.
For example:
SKU "42BH" + Name "Columbia 180° Grip Flat Box Handle - 42\"" => "42BH Columbia 180° Grip Flat Box Handle - 42\""

Only use fallback queries if the primary query does not produce enough valid product-detail retailer results.

FALLBACK SEARCH QUERIES
${queries.slice(1).map((query, index) => `${index + 2}. ${query}`).join("\n")}

VALID MATCH STANDARD
A listing may be a valid match when it satisfies one or more of:
1. The retailer page title, SKU field, URL slug, or product copy contains the target SKU.
2. The product title has the same brand + model/tool family + size/configuration as the target.
3. The result appears from the exact primary CSV query and the page is a retailer product-detail page for the same configuration.

IMPORTANT MATCHING RULES
1. Prioritize retailer/distributor product-detail pages discovered from the primary CSV query.
2. Return real retailer/distributor product-detail URLs only. Do not return Google result pages, category pages, PDF files, images, search pages, or manufacturer pages without an active purchasable price.
3. Reject bundles, kits, cases, multi-packs, used/refurbished/open-box, rentals, discontinued, out-of-stock-only, quote-only, call-for-price, auction, marketplace-noise, and structurally different variants.
4. Extract active single-unit USD retail price only. Exclude tax, shipping, financing, rebates, cart-only discounts, and bulk pricing.
5. Use high confidence when SKU appears in retailer SKU, URL, title, or product copy and the configuration matches.
6. Use medium confidence when SKU is not visible but brand + product title + size/configuration clearly match.
7. Use low confidence only for review-only candidates; do not include weak guesses as valid matches.
8. If a URL appears to be an exact product-detail URL but direct server verification is blocked by retailer bot protection, still include it when Google Search evidence clearly supports product identity and price.

RETURN ONLY VALID JSON. No markdown, no prose, no trailing commas.

Schema:
{
  "matches": [
    {
      "retailer": "Retailer display name",
      "retailerDomain": "retailer-domain.com",
      "price": 123.45,
      "url": "https://specific-product-detail-url",
      "sku": "Retailer SKU if visible, otherwise null",
      "retailerSku": "Retailer SKU if visible, otherwise null",
      "productName": "Retailer product title",
      "confidence": "high|medium|low",
      "matchScore": 0,
      "availability": "in_stock|limited_stock|unknown|out_of_stock",
      "isSingleUnit": true,
      "priceType": "regular|sale|clearance|advertised|unknown",
      "matchReasons": ["specific SKU/name/configuration evidence"],
      "rejectionRisks": ["specific caveat if any"],
      "explanation": "One short sentence explaining why this is the same product."
    }
  ]
}`;
}
async function runGeminiResearch(product: Product): Promise<{ matches: AiResearchMatch[]; realtime: boolean; error?: string }> {
  if (isApiKeyPlaceholder) {
    return { matches: [], realtime: false, error: "Gemini API key missing or placeholder." };
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildScanPrompt(product),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  retailer: { type: Type.STRING },
                  retailerDomain: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  url: { type: Type.STRING },
                  sku: { type: Type.STRING },
                  retailerSku: { type: Type.STRING },
                  retailerMpn: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  availability: { type: Type.STRING },
                  isSingleUnit: { type: Type.BOOLEAN },
                  priceType: { type: Type.STRING },
                  matchReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rejectionRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  explanation: { type: Type.STRING }
                },
                required: ["retailer", "price", "url", "productName", "confidence", "explanation"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const rawText = response.text || "{}";
    const parsed = JSON.parse(rawText);
    return { matches: normalizeAiMatches(parsed), realtime: true };
  } catch (err: any) {
    const error = String(err?.message || err || "Gemini research failed");
    console.error("Gemini pricing research error:", error);
    return { matches: [], realtime: true, error };
  }
}

function shouldRecordMatch(product: Product, match: AiResearchMatch, verification: UrlVerificationResult): { ok: boolean; pending: boolean; reason: string } {
  if (!verification.ok) {
    return { ok: false, pending: false, reason: `URL verification rejected: ${verification.kind}${verification.status ? ` ${verification.status}` : ""}` };
  }

  const price = coerceFiniteMoney(match.price);
  if (!price) return { ok: false, pending: false, reason: "Invalid or missing price." };

  if (match.availability === "out_of_stock") {
    return { ok: false, pending: false, reason: "Rejected out-of-stock listing." };
  }

  if (match.isSingleUnit === false) {
    return { ok: false, pending: false, reason: "Rejected non-single-unit listing." };
  }

  const confidence = toConfidence(match.confidence);
  const score = Number.isFinite(Number(match.matchScore)) ? Number(match.matchScore) : confidence === "high" ? 90 : confidence === "medium" ? 75 : 50;
  const skuEvidence = hasCatalogSkuEvidence(product, match);
  const identifierEvidence = hasIdentifierEvidence(product, match);
  const brandNameEvidence = hasBrandNameEvidence(product, match);
  const rejectionRisks = match.rejectionRisks || [];
  const hasHardRisk = rejectionRisks.some(risk => /bundle|kit|case|multi|used|refurb|rental|quote|call|auction|different|mismatch|out of stock/i.test(risk));

  if (hasHardRisk) {
    return { ok: false, pending: false, reason: `Rejected risk signal: ${rejectionRisks.join("; ")}` };
  }

  if (skuEvidence && confidence !== "low" && score >= 70) {
    return { ok: true, pending: false, reason: "Verified CSV SKU match from retailer evidence." };
  }

  if (confidence === "high" && score >= DEFAULT_MIN_MATCH_SCORE && (identifierEvidence || brandNameEvidence)) {
    return { ok: true, pending: false, reason: "High-confidence catalog match." };
  }

  if (confidence === "medium" && score >= 70) {
    if (identifierEvidence || brandNameEvidence) {
      return { ok: true, pending: false, reason: "Medium-confidence brand/name/configuration match accepted because imported catalog has no MPN." };
    }

    return { ok: false, pending: true, reason: "Medium-confidence match requires equivalence review; no SKU/name evidence found." };
  }

  return { ok: false, pending: confidence !== "low", reason: "Insufficient confidence, score, or catalog evidence." };
}
async function addScanLog(input: Partial<ScanLog> & Pick<ScanLog, "sku" | "productName" | "competitorName" | "crawledUrl">): Promise<void> {
  await LocalDB.addLog({
    id: (input as any).id,
    timestamp: input.timestamp || new Date().toISOString(),
    sku: input.sku,
    productName: input.productName,
    competitorName: input.competitorName,
    crawledUrl: input.crawledUrl,
    extractedPrice: input.extractedPrice ?? null,
    outcome: input.outcome || "price_extracted",
    adjustmentAction: input.adjustmentAction || "None (Safety Reject)",
    oldPrice: input.oldPrice ?? 0,
    newPrice: input.newPrice ?? 0,
    confidence: input.confidence || "low",
    details: input.details || "No details recorded.",
    isRealtimeScan: Boolean(input.isRealtimeScan)
  } as ScanLog);
}

async function addPendingEquivalence(product: Product, match: AiResearchMatch, reason: string): Promise<void> {
  const mapping: EquivalenceMapping = {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productSku: product.sku,
    productId: product.id,
    competitorName: resolveCompetitorName(match),
    competitorSku: normalizeWhitespace(match.retailerSku || match.sku || match.retailerMpn || "UNKNOWN"),
    competitorProductName: match.productName,
    competitorPrice: Number(match.price),
    competitorUrl: match.url,
    matchScore: Number(match.matchScore || 0),
    matchReasons: [...(match.matchReasons || []), reason].filter(Boolean),
    status: "pending",
    createdAt: new Date().toISOString()
  } as EquivalenceMapping;

  const maybeAddEquivalence = (LocalDB as any).addEquivalence;
  if (typeof maybeAddEquivalence === "function") {
    await maybeAddEquivalence(mapping);
    return;
  }

  const maybeUpdateEquivalences = (LocalDB as any).updateEquivalences;
  if (typeof maybeUpdateEquivalences === "function") {
    await maybeUpdateEquivalences((items: EquivalenceMapping[]) => items.push(mapping));
  }
}

function toCompetitorSnapshot(match: AiResearchMatch, verification: UrlVerificationResult): any {
  return {
    price: Number(match.price),
    url: verification.finalUrl || match.url,
    retailerSku: match.retailerSku || match.sku || null,
    retailerMpn: match.retailerMpn || null,
    productName: match.productName,
    confidence: toConfidence(match.confidence),
    matchScore: Number(match.matchScore || (match.confidence === "high" ? 90 : match.confidence === "medium" ? 75 : 50)),
    availability: match.availability === "limited_stock" ? "limited_stock" : "in_stock",
    priceType: match.priceType && match.priceType !== "unknown" ? match.priceType : "regular",
    lastUpdated: new Date().toISOString(),
    verificationStatus: verification.kind,
    verificationHttpStatus: verification.status
  };
}

async function recordCompetitorSnapshot(product: Product, competitorName: string, match: AiResearchMatch, verification: UrlVerificationResult): Promise<void> {
  const snapshot = toCompetitorSnapshot(match, verification);

  await LocalDB.updateProducts((products: Product[]) => {
    const p = products.find(prod => prod.id === product.id);
    if (!p) return;
    p.competitors = p.competitors || {};
    (p.competitors as any)[competitorName] = snapshot;
    p.lastScannedPrice = Number(match.price);
    p.lastScanTime = new Date().toISOString();
  });
}

async function performResearch(productId?: string): Promise<{ success: boolean; results?: ResearchResult[]; error?: string; isRealtimeGeminiSupported: boolean }> {
  const products = await LocalDB.getProducts();
  const allCompetitors = await LocalDB.getCompetitors();
  const targetProducts = productId ? products.filter((p: Product) => p.id === productId) : products;

  if (targetProducts.length === 0) {
    return { success: false, error: "No products matched.", isRealtimeGeminiSupported: !isApiKeyPlaceholder };
  }

  const results: ResearchResult[] = [];

  for (const product of targetProducts) {
    const details: string[] = [];
    const research = await runGeminiResearch(product);
    const matches = research.matches;

    if (research.error) {
      await addScanLog({
        sku: product.sku,
        productName: product.name,
        competitorName: "Gemini Research",
        crawledUrl: "N/A",
        extractedPrice: null,
        outcome: research.error.includes("429") || research.error.toLowerCase().includes("quota") ? "error" : "not_found",
        adjustmentAction: "None (Safety Reject)",
        oldPrice: product.currentPrice,
        newPrice: product.currentPrice,
        confidence: "low",
        details: research.error,
        isRealtimeScan: research.realtime
      });
      details.push(research.error);
    }

    if (matches.length === 0) {
      await addScanLog({
        sku: product.sku,
        productName: product.name,
        competitorName: "Research",
        crawledUrl: "N/A",
        extractedPrice: null,
        outcome: "not_found",
        adjustmentAction: "None (Safety Reject)",
        oldPrice: product.currentPrice,
        newPrice: product.currentPrice,
        confidence: "low",
        details: `No AI research matches returned. Primary CSV query: "${getPrimaryCatalogQuery(product)}". Fallback queries: ${buildSearchQueries(product).slice(1).join(" | ")}`,
        isRealtimeScan: research.realtime
      });

      results.push({
        success: true,
        sku: product.sku,
        recordedMatches: 0,
        pendingMappings: 0,
        rejectedMatches: 0,
        aiMatches: 0,
        details
      });
      continue;
    }

    let recordedMatches = 0;
    let pendingMappings = 0;
    let rejectedMatches = 0;

    for (const match of matches) {
      const competitorName = resolveCompetitorName(match, findConfiguredCompetitor(match, allCompetitors));
      const verification = await verifyProductUrl(match.url);
      const decision = shouldRecordMatch(product, match, verification);

      if (decision.ok) {
        await recordCompetitorSnapshot(product, competitorName, match, verification);
        recordedMatches++;

        await addScanLog({
          sku: product.sku,
          productName: product.name,
          competitorName,
          crawledUrl: verification.finalUrl || match.url,
          extractedPrice: Number(match.price),
          outcome: "price_extracted",
          adjustmentAction: "Research Recorded" as any,
          oldPrice: product.currentPrice,
          newPrice: product.currentPrice,
          confidence: toConfidence(match.confidence),
          details: `${decision.reason} Primary CSV query="${getPrimaryCatalogQuery(product)}". Price $${Number(match.price).toFixed(2)}. Verification=${verification.kind}${verification.status ? `/${verification.status}` : ""}. ${match.explanation || ""}`,
          isRealtimeScan: research.realtime
        });
        continue;
      }

      if (decision.pending) {
        await addPendingEquivalence(product, match, decision.reason);
        pendingMappings++;

        await addScanLog({
          sku: product.sku,
          productName: product.name,
          competitorName,
          crawledUrl: match.url,
          extractedPrice: Number(match.price),
          outcome: "ambiguous_match" as any,
          adjustmentAction: "None (Safety Reject)",
          oldPrice: product.currentPrice,
          newPrice: product.currentPrice,
          confidence: toConfidence(match.confidence),
          details: `${decision.reason} Stored as pending equivalence mapping. Verification=${verification.kind}${verification.status ? `/${verification.status}` : ""}.`,
          isRealtimeScan: research.realtime
        });
        continue;
      }

      rejectedMatches++;
      await addScanLog({
        sku: product.sku,
        productName: product.name,
        competitorName,
        crawledUrl: match.url,
        extractedPrice: Number(match.price),
        outcome: verification.kind === "not_found" ? "verification_failed" : "not_found",
        adjustmentAction: "None (Safety Reject)",
        oldPrice: product.currentPrice,
        newPrice: product.currentPrice,
        confidence: toConfidence(match.confidence),
        details: `${decision.reason}. Verification=${verification.kind}${verification.status ? `/${verification.status}` : ""}. Error=${verification.error || "none"}`,
        isRealtimeScan: research.realtime
      });
    }

    results.push({
      success: true,
      sku: product.sku,
      recordedMatches,
      pendingMappings,
      rejectedMatches,
      aiMatches: matches.length,
      details
    });
  }

  return { success: true, results, isRealtimeGeminiSupported: !isApiKeyPlaceholder };
}

async function performCalibration(productId?: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
  const products = await LocalDB.getProducts();
  const targetProducts = productId ? products.filter((p: Product) => p.id === productId) : products;

  if (targetProducts.length === 0) return { success: false, error: "No products matched." };

  const results: any[] = [];

  for (const product of targetProducts) {
    const currentProduct = (await LocalDB.getProducts()).find((p: Product) => p.id === product.id);
    if (!currentProduct) continue;

    const oldPrice = currentProduct.currentPrice;
    const calResult: any = await calibrateProductPrice(currentProduct);

    await LocalDB.updateProducts((products: Product[]) => {
      const p = products.find(prod => prod.id === product.id);
      if (!p) return;

      p.status = calResult.action === "Pricing Floor Locked" ? "Floor Lock Triggered" : "Optimized";

      if (p.strategyMode === "auto") {
        p.currentPrice = calResult.newPrice;
        p.suggestedPrice = undefined;
        p.suggestedPriceDetails = undefined;
      } else {
        p.suggestedPrice = calResult.newPrice;
        p.suggestedPriceDetails = calResult.details;
        p.status = calResult.action === "Pricing Floor Locked" ? "Floor Lock Triggered" : "Needs Attention";
      }

      if (calResult.marketAverage !== undefined) {
        (p as any).marketTruthfulAverage = calResult.marketAverage;
      }
      if (calResult.competitivenessScore !== undefined) {
        p.competitivenessScore = calResult.competitivenessScore;
      }
    });

    await addScanLog({
      sku: currentProduct.sku,
      productName: currentProduct.name,
      competitorName: "Pricing Engine",
      crawledUrl: "N/A",
      extractedPrice: null,
      outcome: "price_extracted",
      adjustmentAction: calResult.action,
      oldPrice,
      newPrice: calResult.newPrice,
      confidence: "high",
      details: String(calResult.details || "Calibration completed."),
      isRealtimeScan: false
    });

    results.push({ sku: currentProduct.sku, oldPrice, newPrice: calResult.newPrice, action: calResult.action });
  }

  return { success: true, results };
}

function requireCatalogFields(body: any): void {
  const hasPrice = body?.price !== undefined || body?.originalPrice !== undefined || body?.currentPrice !== undefined;
  const missing = ["sku", "name", "cost"].filter(field => body?.[field] === undefined || body?.[field] === null || body?.[field] === "");

  if (!hasPrice) missing.push("price");

  if (missing.length > 0) {
    const error = new Error(`Missing required catalog fields: ${missing.join(", ")}. Expected imported CSV shape: brand, sku, name, category, cost, price.`) as ApiError;
    error.status = 400;
    error.expose = true;
    throw error;
  }
}
function buildProductFromPayload(item: any, existing?: Product): Product {
  const sku = normalizeIdentifier(item.sku);
  const catalogPrice = coerceFiniteMoney(item.price);
  const originalPrice = coerceFiniteMoney(item.originalPrice ?? item.price);
  const currentPrice = coerceFiniteMoney(item.currentPrice ?? item.price ?? item.originalPrice);
  const cost = coerceFiniteMoney(item.cost);
  const minMarginPercent =
    item.minMarginPercent !== undefined && item.minMarginPercent !== null && item.minMarginPercent !== ""
      ? Number(item.minMarginPercent)
      : existing?.minMarginPercent ?? DEFAULT_IMPORT_MIN_MARGIN_PERCENT;

  if (!sku || !normalizeWhitespace(item.name) || !originalPrice || !currentPrice || !cost || !Number.isFinite(minMarginPercent)) {
    throw new Error("Invalid product payload. Expected valid sku, name, cost, and price. minMarginPercent is optional and defaults from PRICING_DEFAULT_MIN_MARGIN_PERCENT.");
  }

  return {
    id: existing?.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sku,
    name: normalizeWhitespace(item.name),
    brand: item.brand ? normalizeWhitespace(item.brand) : (existing as any)?.brand,
    upc: item.upc ? normalizeWhitespace(item.upc) : (existing as any)?.upc,
    category: item.category ? normalizeWhitespace(item.category) : (existing as any)?.category,
    cost,
    minMarginPercent,
    currentPrice,
    originalPrice: originalPrice || catalogPrice || currentPrice,
    status: existing?.status || "Needs Attention",
    competitors: existing?.competitors || {},
    pricingStrategy: item.pricingStrategy || existing?.pricingStrategy || "ai_auto",
    strategyMode: item.strategyMode || existing?.strategyMode || "suggest",
    competitivenessScore: existing?.competitivenessScore ?? 100,
    valuePropositions: existing?.valuePropositions || []
  } as Product;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "dtb-pricing-engine",
    realtimeGeminiSupported: !isApiKeyPlaceholder,
    model: GEMINI_MODEL,
    hardReject404: HARD_REJECT_404,
    defaultImportMinMarginPercent: DEFAULT_IMPORT_MIN_MARGIN_PERCENT,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/products", asyncRoute(async (_req, res) => {
  res.json(await LocalDB.getProducts());
}));

app.post("/api/products/add", asyncRoute(async (req, res) => {
  requireCatalogFields(req.body);
  let newProduct: Product | undefined;

  await LocalDB.updateProducts((products: Product[]) => {
    newProduct = buildProductFromPayload(req.body);
    products.push(newProduct);
  });

  res.json({ success: true, product: newProduct });
}));

app.post("/api/products/import", asyncRoute(async (req, res) => {
  const { products: importedList } = req.body;
  if (!Array.isArray(importedList)) {
    return res.status(400).json({ error: "Invalid payload, expected array under 'products'." });
  }

  const addedProducts: Product[] = [];
  const rejectedRows: { index: number; reason: string }[] = [];

  await LocalDB.updateProducts((currentProducts: Product[]) => {
    importedList.forEach((item: any, index: number) => {
      try {
        if (!item?.sku || !item?.name || item.cost === undefined || (item.price === undefined && item.originalPrice === undefined && item.currentPrice === undefined)) {
          rejectedRows.push({ index, reason: "Missing required catalog fields. Expected sku, name, cost, and price." });
          return;
        }

        const sku = normalizeIdentifier(item.sku);
        const existingIdx = currentProducts.findIndex((p: Product) => normalizeIdentifier(p.sku) === sku);
        const newProduct = buildProductFromPayload(item, existingIdx >= 0 ? currentProducts[existingIdx] : undefined);

        if (existingIdx >= 0) currentProducts[existingIdx] = newProduct;
        else currentProducts.push(newProduct);

        addedProducts.push(newProduct);
      } catch (err: any) {
        rejectedRows.push({ index, reason: String(err?.message || err) });
      }
    });
  });

  if (addedProducts.length > 0) {
    await addScanLog({
      sku: "MULTIPLE",
      productName: "Bulk Imported CSV Catalog",
      competitorName: "System",
      crawledUrl: "N/A",
      extractedPrice: null,
      outcome: "price_extracted",
      adjustmentAction: "Catalog Updated",
      oldPrice: 0,
      newPrice: 0,
      confidence: "high",
      details: `Imported/merged ${addedProducts.length} SKU(s). Rejected ${rejectedRows.length} row(s).`,
      isRealtimeScan: false
    });
  }

  res.json({ success: true, count: addedProducts.length, rejectedRows });
}));

app.post("/api/products/bulk-update-settings", asyncRoute(async (req, res) => {
  const { minMarginPercent, pricingStrategy, strategyMode } = req.body;
  let updatedCount = 0;

  await LocalDB.updateProducts((products: Product[]) => {
    for (const p of products) {
      if (minMarginPercent !== undefined) p.minMarginPercent = Number(minMarginPercent);
      if (pricingStrategy !== undefined) p.pricingStrategy = pricingStrategy;
      if (strategyMode !== undefined) p.strategyMode = strategyMode;
      updatedCount++;
    }
  });

  await addScanLog({
    sku: "GLOBAL",
    productName: "Catalog Configuration Update",
    competitorName: "System",
    crawledUrl: "N/A",
    extractedPrice: null,
    outcome: "price_extracted",
    adjustmentAction: "Catalog Updated",
    oldPrice: 0,
    newPrice: 0,
    confidence: "high",
    details: `Updated settings for ${updatedCount} products. Margin=${minMarginPercent ?? "unchanged"}; Strategy=${pricingStrategy ?? "unchanged"}; Mode=${strategyMode ?? "unchanged"}.`,
    isRealtimeScan: false
  });

  res.json({ success: true, count: updatedCount });
}));

app.post("/api/products/update", asyncRoute(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing product id." });

  let updatedProd: Product | undefined;

  await LocalDB.updateProducts((products: Product[]) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    if (req.body.cost !== undefined) p.cost = Number(req.body.cost);
    if (req.body.minMarginPercent !== undefined) p.minMarginPercent = Number(req.body.minMarginPercent);
    if (req.body.currentPrice !== undefined) p.currentPrice = Number(req.body.currentPrice);
    if (req.body.originalPrice !== undefined) p.originalPrice = Number(req.body.originalPrice);
    if (req.body.pricingStrategy !== undefined) p.pricingStrategy = req.body.pricingStrategy;
    if (req.body.strategyMode !== undefined) p.strategyMode = req.body.strategyMode;
    if (req.body.brand !== undefined) (p as any).brand = normalizeWhitespace(req.body.brand);
    if (req.body.upc !== undefined) (p as any).upc = normalizeWhitespace(req.body.upc);
    if (req.body.category !== undefined) (p as any).category = normalizeWhitespace(req.body.category);

    updatedProd = p;
  });

  if (!updatedProd) return res.status(404).json({ error: "Product not found." });
  res.json({ success: true, product: updatedProd });
}));

app.post("/api/pricing/research", asyncRoute(async (req, res) => {
  const result = await performResearch(req.body?.productId);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
}));

app.post("/api/pricing/calibrate", asyncRoute(async (req, res) => {
  const result = await performCalibration(req.body?.productId);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
}));

app.post("/api/pricing/scan-and-calibrate", asyncRoute(async (req, res) => {
  const productId = req.body?.productId;
  const research = await performResearch(productId);
  if (!research.success) return res.status(404).json(research);

  const calibrate = await performCalibration(productId);
  if (!calibrate.success) return res.status(404).json(calibrate);

  res.json({ success: true, research, calibrate });
}));

app.post("/api/products/clear", asyncRoute(async (_req, res) => {
  await LocalDB.updateProducts((products: Product[]) => {
    products.length = 0;
  });

  await addScanLog({
    sku: "SYSTEM",
    productName: "Catalog Reset",
    competitorName: "System",
    crawledUrl: "N/A",
    extractedPrice: null,
    outcome: "price_extracted",
    adjustmentAction: "Catalog Updated",
    oldPrice: 0,
    newPrice: 0,
    confidence: "high",
    details: "The entire product catalog was cleared by the user.",
    isRealtimeScan: false
  });

  res.json({ success: true });
}));

app.get("/api/competitors", asyncRoute(async (_req, res) => res.json(await LocalDB.getCompetitors())));
app.get("/api/logs", asyncRoute(async (_req, res) => res.json(await LocalDB.getScanLogs())));
app.get("/api/rules", asyncRoute(async (_req, res) => res.json(await LocalDB.getRules())));
app.get("/api/equivalence-mappings", asyncRoute(async (_req, res) => res.json(await LocalDB.getEquivalences())));

app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, error: "API route not found." });
});

app.use((err: ApiError, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const expose = err.expose || status < 500;
  console.error("Server error:", err);
  res.status(status).json({
    success: false,
    error: expose ? err.message : "Internal server error."
  });
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
