const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename
}).outputText, filename);
process.loadEnvFile();
const { searchMealPlan } = require('../server/mealSearch.ts');
searchMealPlan({budget:82,dietaryNeeds:'none',nutritionalGoal:'none'}, console.log).then(plan=>{
 console.log(JSON.stringify({distinct:plan.distinctRecipes,total:plan.weeklyCost,searched:plan.searchedSources,recipes:plan.days.flatMap(d=>d.meals).map(m=>({name:m.name,url:m.recipeUrl}))},null,2));
 fs.mkdirSync('.expo', {recursive:true}); fs.writeFileSync('.expo/verified-live-plan.json', JSON.stringify(plan));
}).catch(error=>{ console.error(error.message); process.exitCode=1; });
