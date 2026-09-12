# MealPrep

MealPrep is an Expo app (works on iOS, Android, and web) that generates a **custom weekly meal plan** based on budget, dietary needs, and nutritional goals, complete with a **shopping list** linked to a real product catalog with prices.

---

## What the app does

1. The user specifies how much they want to spend per week, any dietary needs (vegetarian, vegan, pescatarian, gluten-free, dairy-free), and nutritional goals (high protein, low sugar, low fat, low carbs, low salt).
2. The app normally generates a plan of **14 meals** (lunch + dinner for 7 days), choosing only from verified recipes. When the budget is too restrictive, it returns one recipe per day instead of failing outright.
3. For each meal, photos, prep time, servings, ingredients with quantities, and step-by-step instructions are shown, with a link to the original recipe.
4. A **shopping list** is automatically built that aggregates the ingredients from all recipes, with the price of each product taken from the catalog. A product can be removed from the list: the plan is regenerated excluding that ingredient (and, if necessary, the entire recipe that requires it).

## The 5 screens (onboarding flow)

| # | File | What happens |
|---|------|---------------|
| 1 | `app/index.tsx` | Lander: title, animated illustration (the groceries "pop out" of the bag), and a button to get started |
| 2 | `app/budget.tsx` | Slider to set the weekly budget (€25–150, default €82) |
| 3 | `app/dietary-needs.tsx` | Multi-select of dietary needs |
| 4 | `app/nutritional-goals.tsx` | Selection of nutritional goals; tapping "Continue" triggers plan generation |
| 5 | `app/meal-plan.tsx` | Weekly plan with day tabs, a recipe card for each meal, and a "shopping list" view |

The state for the whole flow (budget, choices, generated plan) lives in a single Zustand store: `lib/store.ts`.

## How the plan is generated

`lib/generateMealPlan.ts` sends preferences to `/api/meal-plan`. The private API key stays on the server.

1. `server/mealSearch.ts` builds targeted web queries from the entire eligible product catalog, dietary selections, nutritional goals, budget and optional free-text requests. It searches English and Italian publishers in up to three rounds, with bounded concurrency and shorter request timeouts to keep responses faster; there is no fixed recipe-count ceiling in a local recipe list.
2. `server/recipeSources.ts` reads the linked publisher page's `schema.org/Recipe` data. The title, photograph, ingredients, servings and method must belong to that same page. Missing or ambiguous source data is rejected.
3. `server/recipeMatching.ts` checks each source ingredient against actual catalog candidates. A prepared product cannot replace a different raw ingredient. Required ingredients cannot be omitted, including seasoning marked “to taste”. Only explicitly optional additions can be omitted; boiling water does not require a grocery product. Instructions are summarized from the source.
4. Every accepted recipe must satisfy all selected preferences. The scheduler first seeks 14 distinct lunches/dinners, requires at least seven different dishes and allows at most two occurrences of any recipe. If that cannot fit the budget, it falls back to one meal per day. It checks the cost of the required grocery packs against the weekly budget.

The initial records in `data/recipes.ts` remain for legacy validation and exclusion migration; they do not limit live discovery. Verified results are cached in server memory for six hours. The service still searches for fresh choices. If compatible recipes or budget are insufficient even for one meal per day, it reports that limitation instead of inventing ingredients. Source access and model availability can affect results.

## Shopping list

- Ingredient name and required quantity appear on the same line.
- Products are grouped by their catalog ID and compatible quantities are added.
- Every displayed ingredient has a real product and catalog price.
- Weekly prices cover whole packs needed for the aggregate quantity, rounded up. The per-meal price is the consumed fraction.
- When catalog pack conversion data is incomplete, costing conservatively reserves whole packs. Prices are estimates from the supplied catalog, not live store quotes.

## Tech stack

- **Expo SDK 57** + **Expo Router** (file-based routing, with `server` web output to support the `/api/meal-plan` endpoint)
- **React Native 0.86** / **React 19**, TypeScript
- **Zustand** for global state (`lib/store.ts`)
- Native slider on iOS/Android (`@react-native-community/slider`), keyboard-accessible HTML slider on web (`components/SliderControl.web.tsx`)
- Custom "Promo" font (see `theme.ts`), design based on a Figma file (details and differences from the original in `design-reference/IMPLEMENTATION.md`)


