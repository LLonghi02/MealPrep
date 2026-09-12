import { searchMealPlan, validatePreferences } from '../../server/mealSearch';

let activeRequests = 0;
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Origin not allowed.' }, { status: 403 });
  if (activeRequests >= 2) return Response.json({ error: 'A recipe search is already in progress. Please try again shortly.' }, { status: 429 });
  let input;
  try {
    const body = await request.text();
    if (body.length > 20000) throw new Error('Request too large.');
    input = validatePreferences(JSON.parse(body));
  } catch { return Response.json({ error: 'Invalid preferences.' }, { status: 400 }); }
  activeRequests++;
  try { return Response.json({ plan: await searchMealPlan(input) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Recipe search is unavailable. Please try again.' }, { status: 422 });
  } finally { activeRequests--; }
}
