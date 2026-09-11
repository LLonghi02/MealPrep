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

## Ricette e lista della spesa

`data/recipes.ts` contiene un catalogo iniziale di 6 ricette verificate sulle
pagine originali il 2026-09-11. Foto, link, porzioni, ingredienti e preparazione
appartengono allo stesso record. L'AI seleziona solo gli ID delle ricette;
non può inventare dettagli o URL. Anche il piano demo usa questi record.
Le esigenze alimentari escludono intere ricette; gli obiettivi nutrizionali
e i preferiti ne orientano la selezione. Con un catalogo piccolo sono possibili
ripetizioni e alcune combinazioni di esclusioni non producono un piano.

Gli ingredienti hanno un nome e un ID indipendenti dal prodotto commerciale.
Solo corrispondenze di catalogo controllate vengono usate per i prezzi:
gli alimenti mancanti restano visibili con prezzo non disponibile.
Il subtotale mostra una confezione per prodotto conosciuto, non il costo
garantito delle quantità settimanali, e non viene limitato artificialmente al budget.
Le foto non disponibili mostrano un segnaposto, senza immagini sostitutive.

Per aggiungere una ricetta, verificare tutti i dati sulla pagina originale,
usare la foto della stessa pagina e aggiungere solo prodotti equivalenti
anche nella forma (fresco, affumicato, in scatola, ecc.). Dopo un aggiornamento
dei record ricaricare l'app e generare un nuovo piano.

Eseguire i test di regressione con `npm test`.
