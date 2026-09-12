import type { Product } from '../lib/types';
import { askModel, objectSchema, outputText } from './openai';

const ESSELUNGA_SEARCH = 'https://spesaonline.esselunga.it/commerce/nav/supermercato/store/ricerca/';

function plain(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

function priceFrom(value: string): number | null {
  const match = value.replace(/\s/g, ' ').match(/(?:€\s*|euro\s*)(\d{1,3}(?:[.,]\d{2})?)/i);
  if (!match) return null;
  const price = Number(match[1].replace(',', '.'));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function buildProduct(id: string, name: string, price: number, url: string): Product {
  return {
    id: `esselunga:${id}`,
    barcode: id,
    name,
    brand: 'Esselunga Online',
    department: { id: 'external', name: 'Esselunga Online' },
    category: { id: 'external', name: 'Verified Esselunga product' },
    quantity: name.match(/\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|pz|pieces?)\b/i)?.[0] || '',
    netContent: null,
    price: { amount: price, currency: 'EUR' },
    priceSource: { retailer: 'Esselunga', url, productUrl: url, observedAt: new Date().toISOString(), note: 'Price read from Esselunga Spesa Online.' },
    unitPrice: { amount: price, unit: 'package' },
    nutrition: { energyKcal100g: 0, fat100g: 0, saturatedFat100g: 0, carbohydrates100g: 0, sugars100g: 0, fiber100g: 0, proteins100g: 0, salt100g: 0 },
    nutriScore: '', novaGroup: 0, labels: [], allergens: [],
  };
}

export async function searchEsselungaProduct(query: string): Promise<Product | null> {
  const url = `${ESSELUNGA_SEARCH}${encodeURIComponent(query.trim())}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'text/html', 'User-Agent': 'MealPrep/1.0 product-price verification' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return null;
    const html = await response.text();
    const product = /<a[^>]+id=["']product-name-([\w-]+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(html);
    if (!product) return null;
    const start = Math.max(0, product.index - 3000);
    const context = plain(html.slice(start, product.index + product[0].length + 3000));
    const price = priceFrom(context);
    if (!price) return null;
    const href = /<a[^>]+href=["']([^"']*\/prodotto\/[^"']+)["'][^>]*>[\s\S]*?product-name-${product[1]}/i.exec(html)?.[1];
    const productUrl = href ? new URL(href, 'https://spesaonline.esselunga.it').href : url;
    return buildProduct(product[1], plain(product[2]), price, productUrl);
  } catch {
    return null;
  }
}

export async function searchEsselungaProducts(queries: string[], limit = 8): Promise<Product[]> {
  const found: Product[] = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, queries.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= Math.min(limit, queries.length)) return;
      const product = await searchEsselungaProduct(queries[index]);
      if (product && !found.some((item) => item.name.toLowerCase() === product.name.toLowerCase())) found.push(product);
    }
  }));
  const remaining = queries.slice(0, Math.min(limit, queries.length)).filter((query) => !found.some((product) => product.name.toLowerCase().includes(query.toLowerCase())));
  if (!remaining.length) return found;
  try {
    const response = await askModel({
      tools: [{ type: 'web_search' }], tool_choice: 'required', include: ['web_search_call.action.sources'], max_output_tokens: 1800,
      text: { format: { type: 'json_schema', name: 'esselunga_products', strict: true, schema: objectSchema({ products: { type: 'array', items: objectSchema({ query: { type: 'string' }, name: { type: 'string' }, price: { type: 'number' }, url: { type: 'string' } }) } }) } },
      instructions: 'Find matching products only on the official Esselunga online grocery site. Return the current package price in EUR, the exact product name, and the official product URL. Do not estimate or invent prices; omit a product when no official Esselunga price is visible. Ignore recipe pages and other retailers.',
      input: `Find Esselunga Online products for these missing grocery ingredients: ${JSON.stringify(remaining)}. Search the official domain spesaonline.esselunga.it only.`,
    });
    const parsed = JSON.parse(outputText(response)) as { products?: { query: string; name: string; price: number; url: string }[] };
    for (const item of parsed.products || []) {
      if (!item || !item.name || !Number.isFinite(item.price) || item.price <= 0 || !/^https:\/\/([\w-]+\.)*esselunga\.it\//i.test(item.url)) continue;
      if (!found.some((product) => product.name.toLowerCase() === item.name.toLowerCase())) found.push(buildProduct(`web-${found.length}`, item.name, item.price, item.url));
    }
  } catch {
    // The dynamic retailer search is optional; keep the catalog-only result when unavailable.
  }
  return found;
}

export function isEsselungaProduct(product: Product): boolean {
  return product.id.startsWith('esselunga:');
}
