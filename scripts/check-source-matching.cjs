const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
process.loadEnvFile();
const original=global.fetch;
global.fetch=async(url,options)=>{
 const response=await original(url,options);
 if(url==='https://api.openai.com/v1/responses'){
  const body=JSON.parse(options.body);const result=await response.clone().json();
  console.log(JSON.stringify({input:JSON.parse(body.input).recipes.map(r=>({url:r.url,ingredients:r.ingredients.map(i=>({line:i.line,candidates:i.candidates.map(p=>({id:p.id,name:p.name}))}))})),output:result.output},null,2));
 }
 return response;
};
(async()=>{
 const {fetchRecipe}=require('../server/recipeSources.ts');const {matchRecipes}=require('../server/recipeMatching.ts');const {eligibleProducts}=require('../server/catalog.ts');
 const input={budget:82,dietaryNeeds:['none'],nutritionalGoals:['none']};
 const recipe=await fetchRecipe(process.argv[2] || 'https://www.bbcgoodfood.com/recipes/creamy-chicken-green-bean-pesto-pasta');
 if(!recipe)throw new Error('Source unavailable');
 const result=await matchRecipes([recipe],eligibleProducts(input),input);
 console.log('Accepted:',result.length);
})().catch(e=>{console.error(e.message);process.exitCode=1});
