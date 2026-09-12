import type { Product } from '../lib/types';
import { askModel, objectSchema, outputText } from './openai';

const ESSELUNGA_ORIGIN = 'https://spesaonline.esselunga.it';
const ESSELUNGA_SEARCH = `${ESSELUNGA_ORIGIN}/commerce/nav/supermercato/store/ricerca/`;
const ESSELUNGA_API = `${ESSELUNGA_ORIGIN}/commerce/resources/search/facet`;

function plain(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ').trim();
}

function priceFrom(value: string): number | null {
  const match = value.replace(/\s/g, ' ').match(/(?:€\s*|euro\s*)(\d{1,3}(?:[.,]\d{2})?)/i)
    || value.match(/(?:price|prezzo|amount|unitPrice)\s*[:=]\s*["']?(\d{1,3}(?:[.,]\d{1,2})?)/i)
    || value.trim().match(/^\d{1,3}(?:[.,]\d{1,2})?$/);
  if (!match) return null;
  const price = Number(match[1].replace(',', '.'));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function buildProduct(id: string, name: string, price: number, url: string): Product {
  return {
    id: `esselunga:${id}`, barcode: id, name, brand: 'Esselunga Online',
    department: { id: 'external', name: 'Esselunga Online' },
    category: { id: 'external', name: 'Verified Esselunga product' },
    quantity: name.match(/\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|pz|pieces?)\b/i)?.[0] || '',
    netContent: null, price: { amount: price, currency: 'EUR' },
    priceSource: { retailer: 'Esselunga', url, productUrl: url, observedAt: new Date().toISOString(), note: 'Price read from Esselunga Spesa Online.' },
    unitPrice: { amount: price, unit: 'package' },
    nutrition: { energyKcal100g: 0, fat100g: 0, saturatedFat100g: 0, carbohydrates100g: 0, sugars100g: 0, fiber100g: 0, proteins100g: 0, salt100g: 0 },
    nutriScore: '', novaGroup: 0, labels: [], allergens: [],
  };
}

function productFromObject(value: unknown, query: string): Product | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const name = [item.name, item.description, item.computedDescription, item.productName, item.title]
    .find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 2);
  const rawPrice = [item.price, item.currentPrice, item.sellingPrice, item.amount, item.unitPrice]
    .find(candidate => typeof candidate === 'number' || typeof candidate === 'string');
  const price = typeof rawPrice === 'number' ? rawPrice : rawPrice ? (Number(String(rawPrice).replace(',', '.')) || priceFrom(String(rawPrice))) : null;
  const id = [item.productId, item.id, item.code, item.barcode, item.ean]
    .find((candidate): candidate is string | number => typeof candidate === 'string' || typeof candidate === 'number');
  const rawUrl = [item.detailUrl, item.productUrl, item.url, item.link]
    .find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);
  if (!name || !price || !id) return null;
  const url = rawUrl ? new URL(rawUrl, ESSELUNGA_ORIGIN).href : `${ESSELUNGA_ORIGIN}/commerce/nav/supermercato/store/ricerca/${encodeURIComponent(query)}`;
  if (!/^https:\/\/(?:[\w-]+\.)*esselunga\.it\//i.test(url)) return null;
  return buildProduct(String(id), plain(name), price, url);
}

function findProducts(value: unknown, query: string, result: Product[] = []): Product[] {
  if (Array.isArray(value)) value.forEach(item => findProducts(item, query, result));
  else if (value && typeof value === 'object') {
    const product = productFromObject(value, query);
    if (product && !result.some(item => item.name.toLowerCase() === product.name.toLowerCase())) result.push(product);
    Object.values(value as Record<string, unknown>).forEach(child => findProducts(child, query, result));
  }
  return result;
}

async function responseProduct(response: Response, query: string): Promise<Product | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) return null;
  if (contentType.includes('json')) {
    const products = findProducts(await response.json(), query);
    return products[0] || null;
  }
  const html = await response.text();
  const product = /<a[^>]+(?:id=["']product-name-([\w-]+)["'][^>]*|class=["'][^"']*product[^"']*["'][^>]*)>([\s\S]*?)<\/a>/i.exec(html);
  if (!product) return null;
  const start = Math.max(0, product.index - 5000);
  const context = plain(html.slice(start, product.index + product[0].length + 5000));
  const price = priceFrom(context);
  if (!price) return null;
  const name = plain(product[2] || product[1]);
  const href = /href=["']([^"']*(?:prodotto|product)[^"']*)["']/i.exec(html.slice(start, product.index + product[0].length + 5000))?.[1];
  return buildProduct(product[1], name, price, href ? new URL(href, ESSELUNGA_ORIGIN).href : `${ESSELUNGA_SEARCH}${encodeURIComponent(query)}`);
}

export async function searchEsselungaProduct(query: string): Promise<Product | null> {
  const clean = query.replace(/\([^)]*\)/g, ' ').replace(/\b(?:to taste|q\.\s*b\.|optional)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const headers = { Accept: 'application/json, text/html', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 MealPrep/1.0', 'X-Requested-With': 'XMLHttpRequest' };
  try {
    // The public page is an Angular shell. Prefer its JSON endpoint, then retain
    // the HTML route as a compatibility fallback for older Esselunga deployments.
    const api = await fetch(ESSELUNGA_API, { method: 'POST', headers, body: JSON.stringify({ query: clean, start: 0, length: 12 }), signal: AbortSignal.timeout(12000) });
    const apiProduct = await responseProduct(api, clean);
    if (apiProduct) return apiProduct;
    const page = await fetch(`${ESSELUNGA_SEARCH}${encodeURIComponent(clean)}`, { headers: { Accept: 'text/html', 'User-Agent': headers['User-Agent'] }, signal: AbortSignal.timeout(12000) });
    return responseProduct(page, clean);
  } catch { return null; }
}

export async function searchEsselungaProducts(queries: string[], limit = 8): Promise<Product[]> {
  const uniqueQueries = [...new Set(queries.map(query => query.trim()).filter(Boolean))].slice(0, Math.min(limit, 12));
  const settled = await Promise.allSettled(uniqueQueries.map(query => searchEsselungaProduct(query)));
  const found = settled.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
  const deduped = found.filter((product, index) => found.findIndex(item => item.name.toLowerCase() === product.name.toLowerCase()) === index);
  const remaining = uniqueQueries.filter(query => !deduped.some(product => product.name.toLowerCase().includes(query.toLowerCase())));
  if (!remaining.length) return deduped;
  try {
    const response = await askModel({
      tools: [{ type: 'web_search' }], tool_choice: 'required', include: ['web_search_call.action.sources'], max_output_tokens: 2400,
      text: { format: { type: 'json_schema', name: 'esselunga_products', strict: true, schema: objectSchema({ products: { type: 'array', items: objectSchema({ query: { type: 'string' }, name: { type: 'string' }, price: { type: 'number' }, url: { type: 'string' } }) } }) } },
      instructions: 'Search only the official Esselunga Online grocery site. Return products only when the official page visibly shows an exact current package price in EUR. Never estimate, invent, or use another retailer. The URL must be the exact official product page, not a search page.',
      input: `Find one exact official Esselunga Online product and current package price for each ingredient: ${JSON.stringify(remaining)}. Search site spesaonline.esselunga.it only.`,
    });
    const parsed = JSON.parse(outputText(response)) as { products?: { name: string; price: number; url: string; query?: string }[] };
    for (const item of parsed.products || []) {
      if (!item?.name || !Number.isFinite(item.price) || item.price <= 0 || !/^https:\/\/(?:[\w-]+\.)*esselunga\.it\//i.test(item.url)) continue;
      if (!deduped.some(product => product.name.toLowerCase() === item.name.toLowerCase())) deduped.push(buildProduct(`web-${deduped.length}`, item.name, item.price, item.url));
    }
  } catch { /* The dynamic retailer search is optional. */ }
  return deduped;
}

export function isEsselungaProduct(product: Product): boolean { return product.id.startsWith('esselunga:'); }
