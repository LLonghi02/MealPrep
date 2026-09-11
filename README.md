# MealPrep — Expo App

Scaffold completo del flusso onboarding MealPrep (5 schermate) basato su
Expo Router + TypeScript + Zustand.

## Setup

```bash
npm install
cp .env.example .env   # inserisci la tua OPENAI_API_KEY
npx expo start
```

## Struttura

```
mealprep/
├── app/                  Routing (Expo Router) — 5 schermate
│   ├── _layout.tsx       Root layout: carica font, definisce lo Stack
│   ├── index.tsx         01 Lander
│   ├── budget.tsx        02 Budget Selection
│   ├── dietary-needs.tsx 03 Dietary Needs Selection
│   ├── nutritional-goals.tsx  04 Nutritional Goals Selection
│   └── meal-plan.tsx     05 Weekly Meal Plan
│
├── components/           UI condivisa
│   ├── Button.tsx
│   ├── ProgressHeader.tsx
│   ├── BudgetSlider.tsx
│   ├── OptionChip.tsx
│   ├── DayTabs.tsx
│   └── MealCard.tsx
│
├── lib/                  Logica non-UI
│   ├── types.ts          Tipi di dominio (Product, Meal, MealPlan, ...)
│   ├── store.ts           Store Zustand (onboarding + piano generato)
│   ├── filterProducts.ts Filtri catalogo per dieta/nutrizione
│   └── generateMealPlan.ts  Prompt building + chiamata LLM + parsing
│
├── data/
│   └── product_catalog_en.json   Catalogo prodotti (3295 articoli)
│
├── assets/
│   ├── fonts/             .ttf da aggiungere (vedi .gitkeep)
│   └── images/            illustrazione Lander da aggiungere
│
├── design-reference/       Materiale statico, non bundlato nell'app
│   ├── demo.html
│   └── stylesheet.css
│
├── theme.ts               Colori, font, spacing, tipografia
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

## Cosa manca per essere production-ready

1. **Font reali**: converti i `.woff`/`.woff2` in `.ttf` (es. transfonter.org)
   e mettili in `assets/fonts/`. I nomi già referenziati in `theme.ts` sono:
   `Promo-Light`, `Promo-Regular`, `Promo-Medium`, `Promo-SemiBold`, `Promo-Bold`.
2. **Illustrazione Lander**: aggiungi `assets/images/lander-illustration.png`.
3. **Colori esatti**: quelli in `theme.ts` sono stimati dallo screenshot —
   confermali col file Figma originale.
4. **API key LLM**: imposta `OPENAI_API_KEY` in `.env` (mai committato) o
   in `app.json` → `expo.extra.openaiApiKey` tramite `app.config.ts`.
5. **Gestione errori/loading più ricca** su `meal-plan.tsx` (retry, skeleton).
