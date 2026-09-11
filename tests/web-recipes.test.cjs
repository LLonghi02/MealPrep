const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const { extractRecipe, fetchRecipe, isRecipeUrl } = require('../server/recipeSources.ts');
const { resolveWebRecipe } = require('../server/recipeMatching.ts');
const { productCandidates, eligibleProducts } = require('../server/catalog.ts');
const { scheduleMeals, searchMealPlan, validatePreferences } = require('../server/mealSearch.ts');
const { getAllProducts } = require('../lib/filterProducts.ts');
const { buildShoppingList } = require('../lib/shopping.ts');
const { generateMealPlan } = require('../lib/generateMealPlan.ts');
const input = { budget: 82, dietaryNeeds: 'none', nutritionalGoal: 'none' };
const product = getAllProducts().find(p => p.id === '3560070500406');
const source = { url: 'https://www.bbcgoodfood.com/recipes/test-pasta', name: 'Fixture pasta', sourceName: 'Good Food',
  imageUrl: 'https://images.immediate.co.uk/fixture-pasta.jpg', servings: 4, minutes: 15, calories: 320,
  ingredients: ['500 g spaghetti pasta'], instructions: ['Cook pasta.', 'Drain and serve.'] };
const matching = { url: source.url, dietCompatible: true, goalCompatible: true, requestsCompatible: true,
  missingIngredientsInSteps: [], ingredients: [{ index: 0, productId: product.id, equivalent: true, amount: 500, unit: 'g' }],
  steps: ['Cook the pasta in boiling water.', 'Drain before serving.'] };

function html(index = 0) {
  return `<script class="schema" type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'Recipe',
    name: `Fixture dish ${index}`, recipeIngredient: source.ingredients, recipeYield: 4, totalTime: 'PT15M',
    image: { url: source.imageUrl }, recipeInstructions: [{ '@type': 'HowToSection', itemListElement: [{ text: 'Cook pasta.' }, { text: 'Drain and serve.' }] }],
  }] })}</script>`;
}

test('publisher JSON-LD supplies the whole recipe, image and instructions', () => {
  const recipe = extractRecipe(html(), source.url);
  assert.equal(recipe.servings, 4);
  assert.equal(recipe.minutes, 15);
  assert.equal(recipe.imageUrl, source.imageUrl);
  assert.deepEqual(recipe.ingredients, source.ingredients);
  assert.deepEqual(recipe.instructions, ['Cook pasta.', 'Drain and serve.']);
  assert.equal(extractRecipe('<html>No recipe here</html>', source.url), null);
  assert.equal(extractRecipe(html() + html(1), source.url), null);
  assert.equal(extractRecipe(html().replace(JSON.stringify({url:source.imageUrl}), 'null'), source.url), null);
});

test('source fetching rejects private URLs and redirects outside recipe publishers', async () => {
  assert.equal(isRecipeUrl('http://127.0.0.1/secret'), false);
  assert.equal(isRecipeUrl('https://bbcgoodfood.com.attacker.test/recipe'), false);
  let calls = 0;
  const result = await fetchRecipe(source.url, async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } }); });
  assert.equal(result, null);
  assert.equal(calls, 1);
});

test('matching preserves source identity, scales servings and requires real catalog products', () => {
  assert.ok(productCandidates(source.ingredients[0], getAllProducts()).some(p => p.id === product.id));
  const meal = resolveWebRecipe(source, matching, getAllProducts());
  assert.ok(meal);
  assert.equal(meal.servings, 1);
  assert.equal(meal.ingredients[0].quantityLabel, '125 g');
  assert.equal(meal.ingredients[0].product.id, product.id);
  assert.equal(meal.imageUrl, source.imageUrl);
  assert.equal(meal.recipeUrl, source.url);
  for (const field of ['dietCompatible', 'goalCompatible', 'requestsCompatible']) assert.equal(resolveWebRecipe(source, { ...matching, [field]: false }, getAllProducts()), null);
  assert.equal(resolveWebRecipe(source, { ...matching, ingredients: [] }, getAllProducts()), null);
  assert.equal(resolveWebRecipe(source, { ...matching, ingredients: [{ ...matching.ingredients[0], productId: 'invented' }] }, getAllProducts()), null);
  assert.equal(resolveWebRecipe(source, matching, []), null);
  assert.equal(resolveWebRecipe(source, { ...matching, ingredients: [{ ...matching.ingredients[0], equivalent: false }] }, getAllProducts()), null);
});

test('required ingredients cannot be omitted; explicitly optional extras can', () => {
  const match = { ...matching, ingredients: [...matching.ingredients, { index: 1, productId: null, equivalent: false, amount: 0, unit: 'g' }] };
  assert.equal(resolveWebRecipe({ ...source, ingredients: [...source.ingredients, '1 tsp salt'] }, match, getAllProducts()), null);
  assert.equal(resolveWebRecipe({ ...source, ingredients: [...source.ingredients, 'salt to taste'] }, match, getAllProducts()), null);
  const meal = resolveWebRecipe({ ...source, ingredients: [...source.ingredients, 'salt (optional)'] }, match, getAllProducts());
  assert.equal(meal.ingredients.length, 1);
  assert.equal(resolveWebRecipe(source, { ...matching, missingIngredientsInSteps: ['fresh garlic'] }, getAllProducts()), null);
});

test('product exclusions and known allergens apply before searching', () => {
  assert.ok(!eligibleProducts({ ...input, excludedProductIds: [product.id] }).some(p => p.id === product.id));
  assert.ok(!eligibleProducts({ ...input, dietaryNeeds: 'gluten_free' }).some(p => p.id === product.id));
  assert.ok(eligibleProducts(input).some(p => p.id === product.id));
  assert.throws(() => validatePreferences({ ...input, budget: -10 }), /non valide/);
  assert.throws(() => validatePreferences({ ...input, dietaryNeeds: 'invented' }), /non valide/);
  assert.throws(() => validatePreferences({ ...input, recipePreferences: 'x'.repeat(501) }), /non valide/);
  const multiple = validatePreferences({ ...input, dietaryNeeds: ['vegan', 'gluten_free'], nutritionalGoals: ['low_salt', 'high_protein'] });
  assert.deepEqual(multiple.dietaryNeeds, ['vegan', 'gluten_free']);
  assert.deepEqual(multiple.nutritionalGoals, ['low_salt', 'high_protein']);
});

test('weekly scheduler guarantees variety and counts sufficient catalog packs within budget', () => {
  const base = resolveWebRecipe(source, matching, getAllProducts());
  const meals = Array.from({ length: 14 }, (_, index) => ({ ...base, name: `Fixture ${index}`, recipeId: `${source.url}-${index}`, recipeUrl: `${source.url}-${index}` }));
  const plan = scheduleMeals(meals, { ...input, budget: 10 }, () => 0.5);
  assert.ok(plan);
  assert.equal(plan.distinctRecipes, 14);
  assert.equal(plan.days.flatMap(d => d.meals).length, 14);
  const shopping = buildShoppingList(plan);
  assert.equal(shopping.items[0].packs, 4); // 14 * 125g = 1750g; four 500g packs.
  assert.equal(shopping.total, Number((product.price.amount * 4).toFixed(2)));
  assert.ok(shopping.total <= 10);
  assert.equal(scheduleMeals(meals, { ...input, budget: 1 }, () => 0.5), null);
  assert.equal(scheduleMeals(meals.slice(0, 6), input), null);
  const seven = scheduleMeals(meals.slice(0, 7), input, () => 0.5);
  const counts = new Map();
  seven.days.flatMap(d => d.meals).forEach(m => counts.set(m.recipeId, (counts.get(m.recipeId) || 0) + 1));
  assert.ok([...counts.values()].every(count => count <= 2));
});

test('search pipeline discovers new URLs, reads pages, maps products and respects all preference fields', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    if (url === 'https://api.openai.com/v1/responses') {
      const body = JSON.parse(options.body); calls.push(body);
      if (body.text?.format?.name === 'recipe_queries') return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({queries: ['Under 20 minutes pasta', 'Under 20 minutes rice', 'Under 20 minutes soup']}) }] }] });
      if (body.tools) return Response.json({ status: 'completed', output: [{ type: 'web_search_call', action: { sources: Array.from({length: 14}, (_, index) => ({url: `https://www.bbcgoodfood.com/recipes/test-${index}`})) } }] });
      const data = JSON.parse(body.input);
      assert.equal(data.preferences.recipePreferences, 'Under 20 minutes');
      return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ recipes: data.recipes.map(recipe => ({ ...matching, url: recipe.url })) }) }] }] });
    }
    return new Response(html(Number(String(url).match(/test-(\d+)/)[1])), { headers: { 'content-type': 'text/html' } });
  };
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only';
  try {
    const plan = await searchMealPlan({ ...input, recipePreferences: 'Under 20 minutes' });
    assert.equal(plan.distinctRecipes, 14);
    assert.equal(plan.source, 'web');
    assert.ok(calls.some(call => call.tools?.some(tool => tool.type === 'web_search')));
    assert.equal(calls.find(call => call.tools).tool_choice, 'required');
    assert.ok(calls[0].input.includes('Under 20 minutes'));
    assert.ok(plan.days.flatMap(day => day.meals).every(meal => meal.ingredients.every(i => i.product.id === product.id)));
  } finally { global.fetch = original; if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; }
});

test('client surfaces unavailable searches instead of falling back to one repeated recipe', async () => {
  const original = global.fetch;
  global.fetch = async () => Response.json({error: 'Not enough compatible recipes'}, {status: 422});
  try { await assert.rejects(generateMealPlan(input), /Not enough compatible recipes/); }
  finally { global.fetch = original; }
});

test('client handles an HTML app fallback, malformed JSON and missing plan', async () => {
  const original = global.fetch;
  try {
    for (const status of [200, 404, 502]) {
      global.fetch = async () => new Response('<!DOCTYPE html><html>MealPrep</html>', {status, headers: {'content-type': 'text/html'}});
      await assert.rejects(generateMealPlan(input), /Riavvia Expo/);
    }
    global.fetch = async () => new Response('<!DOCTYPE html>', {headers: {'content-type': 'application/json'}});
    await assert.rejects(generateMealPlan(input), /dati non validi/);
    global.fetch = async () => Response.json({});
    await assert.rejects(generateMealPlan(input), /piano completo/);
  } finally { global.fetch = original; }
});
