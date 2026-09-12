const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, f);
const { fetchRecipe, isOptionalIngredient } = require('../server/recipeSources.ts');
const { buildShoppingList } = require('../lib/shopping.ts');
const catalog = new Map(require('../data/product_catalog_en.json').map(p => [p.id, p]));
(async () => {
  const plan = JSON.parse(fs.readFileSync('.expo/verified-live-plan.json', 'utf8'));
  const meals = plan.days.flatMap(d => d.meals);
  assert.equal(plan.days.length, 7);
  assert.equal(meals.length, 14);
  const unique = [...new Map(meals.map(m => [m.recipeUrl, m])).values()];
  assert.ok(unique.length >= 7);
  for (const meal of unique) {
    const source = await fetchRecipe(meal.recipeUrl);
    assert.ok(source, `Source available: ${meal.recipeUrl}`);
    assert.equal(meal.name, source.name);
    assert.equal(meal.imageUrl, source.imageUrl);
    for (const line of source.ingredients) {
      assert.ok(isOptionalIngredient(line) || meal.ingredients.some(i => i.sourceIngredient === line), `Required ingredient retained: ${line}`);
    }
    for (const ingredient of meal.ingredients) {
      assert.ok(ingredient.name && ingredient.quantityLabel);
      assert.deepEqual(ingredient.product, catalog.get(ingredient.product.id));
    }
  }
  assert.equal(buildShoppingList(plan).total, plan.weeklyCost);
  assert.ok(plan.weeklyCost <= 82);
  console.log(JSON.stringify({meals: meals.length, recipes: unique.length, total: plan.weeklyCost, sourceIdentity: 'verified', catalogProducts: 'verified'}));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
