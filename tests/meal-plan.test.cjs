const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

// Run domain code and server-rendered web components without Metro or a live API.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
}
require.extensions['.png'] = (module) => { module.exports = { uri: 'test-image.png' }; };
require.extensions['.ttf'] = (module) => { module.exports = 'test-font.ttf'; };
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react-native') return originalLoad.call(this, 'react-native-web', ...args);
  if (name === 'expo-router') return { useRouter: () => ({ replace() {} }) };
  if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
  return originalLoad.call(this, name, ...args);
};

delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const { recipes } = require('../data/recipes.ts');
const { availableRecipes, generateMealPlan, parseAndValidate } = require('../lib/generateMealPlan.ts');
const { aggregateQuantities, buildShoppingList } = require('../lib/shopping.ts');
const { getAllProducts } = require('../lib/filterProducts.ts');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ShoppingList } = require('../app/meal-plan.tsx');
const { MealCard } = require('../components/MealCard.tsx');
const input = { budget: 82, dietaryNeeds: 'none', nutritionalGoal: 'none' };
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

test('shopping rows show ingredient names and quantities together with catalog prices', () => {
  const items = [
    { id: 'pasta', name: 'Pasta', quantities: ['200 g', '300 g'], product: getAllProducts()[0] },
    { id: 'milk', name: 'Milk', quantities: ['250 ml'], product: getAllProducts()[0] },
    { id: 'cheese', name: 'Cheese', quantities: ['2 pieces'], product: getAllProducts()[0] },
  ];
  const html = renderToStaticMarkup(React.createElement(ShoppingList, { items, total: 0, refreshing: false, onRemove() {} }));
  for (const text of ['Pasta · 500 g', 'Milk · 250 ml', 'Cheese · 2 pieces']) assert.ok(html.includes(text), text);
});

test('quantities aggregate compatible units and retain serving instructions', () => {
  assert.equal(aggregateQuantities(['200 g', '0,5 kg']), '700 g');
  assert.equal(aggregateQuantities(['250 ml', '1 l']), '1250 ml');
  assert.equal(aggregateQuantities(['1 clove', '2 cloves']), '3 cloves');
  assert.equal(aggregateQuantities(['1', '2']), '3');
  assert.equal(aggregateQuantities(['to taste', 'to taste']), 'to taste (2 recipes)');
});

test('all 14 meals resolve ingredients, images and links from the same source', async () => {
  const plan = await generateMealPlan(input);
  assert.deepEqual(plan.days.map((day) => day.day), days);
  const meals = plan.days.flatMap((day) => day.meals);
  assert.equal(meals.length, 14);
  for (const meal of meals) {
    const source = recipes.find((recipe) => recipe.id === meal.recipeId);
    assert.equal(meal.imageUrl, source.imageUrl);
    assert.equal(meal.recipeUrl, source.recipeUrl);
    assert.equal(meal.name, source.name);
    assert.equal(meal.servings, source.servings);
    assert.deepEqual(meal.ingredients.map(({ id, quantityLabel }) => ({ id, quantityLabel })), source.ingredients.map(({ id, quantityLabel }) => ({ id, quantityLabel })));
    assert.ok(!meal.imageUrl.includes('unsplash'));
    assert.ok(!meal.recipeUrl.includes('/collection/'));
  }
  const shopping = buildShoppingList(plan);
  for (const ingredient of meals.flatMap((meal) => meal.ingredients)) assert.ok(shopping.items.some((item) => item.id === ingredient.id));
  for (const item of shopping.items) {
    assert.ok(getAllProducts().some((product) => product.id === item.product.id));
    assert.equal(item.name, item.product.name);
    assert.ok(Number.isFinite(item.product.price.amount));
  }
  assert.ok(!shopping.items.some((item) => item.id === 'avocado'));
});

test('model output cannot override source details or invent recipe IDs', () => {
  const raw = { days: days.map((day) => ({ day, recipeIds: ['pesto-pasta', 'pesto-pasta'], imageUrl: 'https://unrelated.example/photo.jpg', ingredientIds: ['wrong'] })) };
  assert.equal(parseAndValidate(raw, recipes).days[0].meals[0].imageUrl, recipes[0].imageUrl);
  raw.days[0].recipeIds[0] = 'invented';
  assert.throws(() => parseAndValidate(raw, recipes), /unverified/);
  assert.throws(() => parseAndValidate({ days: [] }, recipes), /7 days/);
  assert.throws(() => parseAndValidate({ days: days.map((day) => ({ day, recipeIds: ['pesto-pasta'] })) }, recipes), /two recipes/);
});

test('dietary restrictions and exclusions remove whole recipes without substitutions', async () => {
  for (const dietaryNeeds of ['none', 'veggie', 'vegan', 'pescatarian', 'gluten_free', 'dairy_free']) {
    if (!availableRecipes({ ...input, dietaryNeeds }).length) {
      await assert.rejects(generateMealPlan({ ...input, dietaryNeeds }), /tutti gli ingredienti nel catalogo/);
      continue;
    }
    const plan = await generateMealPlan({ ...input, dietaryNeeds });
    for (const meal of plan.days.flatMap((day) => day.meals)) assert.ok(recipes.find((recipe) => recipe.id === meal.recipeId).dietaryNeeds.includes(dietaryNeeds));
  }
  for (const excluded of ['basil-pesto', '8019730079981', 'avocado']) {
    const candidates = availableRecipes({ ...input, excludedProductIds: [excluded] });
    for (const recipe of candidates) assert.ok(recipe.ingredients.every((ingredient) => ingredient.id !== excluded && !ingredient.productIds.includes(excluded)));
  }
  await assert.rejects(generateMealPlan({ ...input, dietaryNeeds: 'vegan', excludedProductIds: ['sea-salt'] }), /ricette verificate/);
});

test('all reviewed product references exist and no price is fabricated for fresh avocado', () => {
  const products = new Map(getAllProducts().map((product) => [product.id, product]));
  for (const recipe of recipes) for (const ingredient of recipe.ingredients) for (const id of ingredient.productIds) assert.ok(products.has(id), `${ingredient.name}: ${id}`);
  assert.deepEqual(recipes.find((recipe) => recipe.id === 'avocado-toast').ingredients[0].productIds, []);
});

test('recipe card renders source ingredient names and source attribution', async () => {
  const plan = await generateMealPlan(input);
  const meal = plan.days.flatMap((day) => day.meals).find((meal) => meal.recipeId === 'pesto-pasta');
  const html = renderToStaticMarkup(React.createElement(MealCard, { meal }));
  assert.ok(html.includes('Spaghetti Pasta'));
  assert.ok(html.includes('Good Food'));
  assert.ok(!html.includes('null kcal'));
  assert.ok(!html.includes('unsplash'));
  const placeholder = renderToStaticMarkup(React.createElement(MealCard, { meal: { ...meal, imageUrl: '' } }));
  assert.ok(placeholder.includes('Recipe photo unavailable'));
  assert.ok(!placeholder.includes('unsplash'));
});


test('incomplete recipes and shopping ingredients are rejected, never silently omitted', async () => {
  assert.deepEqual(availableRecipes(input).map((recipe) => recipe.id), ['pesto-pasta']);
  const raw = { days: days.map((day) => ({ day, recipeIds: ['avocado-toast', 'avocado-toast'] })) };
  assert.throws(() => parseAndValidate(raw, recipes), /non disponibile nel catalogo/);
  const plan = await generateMealPlan(input);
  plan.days[0].meals[0].ingredients[0].product = undefined;
  assert.throws(() => buildShoppingList(plan), /must belong to the product catalog/);
});
