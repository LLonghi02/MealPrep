// Recover explicit source quantities when the model returns zero. Never invent
// weights for a handful, a clove, or an unspecified spoonful.
export function explicitSourceQuantity(line: string): { amount: number; unit: 'g' | 'ml' | 'piece' } | null {
  const fractions: Record<string, number> = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3 };
  const text = line.toLowerCase().replace(/(\d+)?([½¼¾⅓⅔])/g, (_, whole, fraction) => String(Number(whole || 0) + fractions[fraction]));
  const pack = text.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  const mass = text.match(/\b(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (pack || mass) {
    const amount = pack ? Number(pack[1]) * Number(pack[2]) : Number(mass![1]);
    const unit = pack ? pack[3] : mass![2];
    return { amount: amount * (unit === 'kg' || unit === 'l' ? 1000 : 1), unit: unit === 'g' || unit === 'kg' ? 'g' : 'ml' };
  }
  const count = text.match(/^(\d+(?:\.\d+)?)\s*(?:small\s*|large\s*|medium\s*)?(?:eggs?\b|uova?\b|lemons?\b|onions?\b|garlic cloves?\b|heads?\s+garlic\b)/);
  return count ? { amount: Number(count[1]), unit: 'piece' } : null;
}
