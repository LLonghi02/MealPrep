export const RECIPE_HOSTS = [
  'bbcgoodfood.com', 'bbcgoodfoodme.com', 'bbc.co.uk', 'loveandlemons.com',
  'budgetbytes.com', 'minimalistbaker.com', 'themediterraneandish.com',
  'allrecipes.com', 'simplyrecipes.com', 'eatingwell.com', 'seriouseats.com',
  'foodnetwork.com', 'delish.com', 'skinnytaste.com', 'cookieandkate.com',
  'giallozafferano.it', 'cucchiaio.it', 'cucina-naturale.it', 'fattoincasadabenedetta.it',
  'ricettedalmondo.it', 'ilcuoreinpentola.it', 'recipetineats.com',
  'thekitchn.com', 'yummytoddlerfood.com', 'healthylittlefoodies.com',
  'forksoverknives.com', 'plantbasedonabudget.com', 'lazycatkitchen.com',
];

export interface SourceRecipe {
  url: string; name: string; imageUrl: string; sourceName: string;
  servings: number; minutes: number; calories: number | null;
  ingredients: string[]; instructions: string[];
}

export function isOptionalIngredient(line: string): boolean {
  return /\boptional\b|\bfacoltativ[oaie]\b/i.test(line);
}

export function isRecipeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443')
      && RECIPE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

function plain(value: unknown): string {
  return typeof value === 'string' ? value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim() : '';
}

function duration(value: unknown): number {
  const match = String(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
  return match ? Number(match[1] || 0) * 60 + Number(match[2] || 0) : 0;
}

function instructions(value: unknown): string[] {
  if (typeof value === 'string') return [plain(value)];
  if (Array.isArray(value)) return value.flatMap(instructions);
  if (!value || typeof value !== 'object') return [];
  const step = value as Record<string, unknown>;
  return step.itemListElement ? instructions(step.itemListElement) : instructions(step.text || step.name);
}

export function extractRecipe(html: string, url: string): SourceRecipe | null {
  const nodes: Record<string, any>[] = [];
  function visit(node: any): void {
    if (!node || typeof node !== 'object') return;
    if ([node['@type']].flat().includes('Recipe')) nodes.push(node);
    if (Array.isArray(node)) node.forEach(visit);
    else if (node['@graph']) visit(node['@graph']);
  }
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(script[1])) continue;
    try { visit(JSON.parse(script[2])); } catch { /* Malformed blocks are not usable sources. */ }
  }
  // Multiple recipe cards can describe different dishes on a collection page.
  if (nodes.length !== 1) return null;
  const node = nodes[0];
  const ingredients = Array.isArray(node.recipeIngredient) ? node.recipeIngredient.map(plain).filter(Boolean) : [];
  const steps = instructions(node.recipeInstructions).filter(Boolean);
  const image = [node.image].flat()[0];
  const imageValue = typeof image === 'string' ? image : image?.url || image?.contentUrl;
  if (typeof imageValue !== 'string' || !imageValue.trim()) return null;
  let imageUrl: string;
  try { imageUrl = new URL(imageValue, url).href; }
  catch { return null; }
  const servings = Number(String([node.recipeYield].flat()[0]).match(/\d+(?:\.\d+)?/)?.[0]);
  const minutes = duration(node.totalTime) || duration(node.prepTime) + duration(node.cookTime);
  if (!plain(node.name) || !ingredients.length || ingredients.length > 30 || !steps.length
    || !imageUrl.startsWith('https://') || !Number.isFinite(servings) || servings < 1 || !minutes) return null;
  const calories = Number(String(node.nutrition?.calories).match(/[\d.]+/)?.[0]);
  return { url, name: plain(node.name), sourceName: new URL(url).hostname.replace(/^www\./, ''),
    imageUrl, servings, minutes, calories: Number.isFinite(calories) ? calories : null,
    ingredients, instructions: steps };
}

// Redirects are checked too, so discovered links cannot fetch local services.
export async function fetchRecipe(url: string, fetcher: typeof fetch = fetch): Promise<SourceRecipe | null> {
  for (let redirect = 0; redirect < 4; redirect++) {
    if (!isRecipeUrl(url)) return null;
    const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'text/html', 'User-Agent': 'MealPrep/1.0 (recipe source verification)' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    let html = '', length = 0;
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 3_000_000) { await reader.cancel(); return null; }
        html += decoder.decode(value, { stream: true });
      }
      return extractRecipe(html + decoder.decode(), url);
    } finally { reader.releaseLock(); }
  }
  return null;
}
