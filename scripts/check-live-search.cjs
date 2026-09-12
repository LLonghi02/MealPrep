const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename
}).outputText, filename);
process.loadEnvFile();
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
 const response = await originalFetch(url, options);
 if (url === 'https://api.openai.com/v1/responses' && options?.body) {
  const body = JSON.parse(options.body);
  if (body.text?.format?.name === 'recipe_matches') {
   fs.mkdirSync('.expo', {recursive:true});
   fs.writeFileSync('.expo/recipe-match-audit.json', JSON.stringify({input:JSON.parse(body.input),response:await response.clone().json()}));
  }
 }
 return response;
};
const matching = require('../server/recipeMatching.ts');
const originalMatch = matching.matchRecipes;
const accepted = new Map();
matching.matchRecipes = async (...args) => {
 const meals = await originalMatch(...args);
 for (const meal of meals) accepted.set(meal.recipeUrl, meal);
 fs.mkdirSync('.expo', {recursive:true});
 fs.writeFileSync('.expo/accepted-live-recipes.json', JSON.stringify([...accepted.values()]));
 return meals;
};
const { searchMealPlan } = require('../server/mealSearch.ts');
searchMealPlan({budget:82,dietaryNeeds:'none',nutritionalGoal:'none'}, console.log).then(plan=>{
 console.log(JSON.stringify({distinct:plan.distinctRecipes,total:plan.weeklyCost,searched:plan.searchedSources,recipes:plan.days.flatMap(d=>d.meals).map(m=>({name:m.name,url:m.recipeUrl}))},null,2));
 fs.mkdirSync('.expo', {recursive:true}); fs.writeFileSync('.expo/verified-live-plan.json', JSON.stringify(plan));
}).catch(error=>{ console.error(error.message); process.exitCode=1; });
