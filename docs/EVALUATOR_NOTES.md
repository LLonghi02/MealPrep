# MealPrep — Evaluator Notes

## A. Decisions made during implementation

### Product and interaction decisions

I treated the five screens as one continuous decision flow: lander → budget → dietary needs → nutritional goals → weekly plan. The onboarding screens share the same layout primitives and progress treatment so that the flow feels consistent rather than like five unrelated pages.

The budget control supports the required €25–€150 range and starts at €82 as a practical middle-ground default. Dietary needs are multi-select, while nutritional goals are single-select: this reflects the difference between constraints that can be combined (for example, vegetarian plus dairy-free) and a primary nutritional direction. Continue actions are disabled until the relevant choice is explicit, which avoids silently generating a plan from incomplete input.

For the meal-plan screen, I used chronological weekday tabs and made the daily content a real recipe card rather than reproducing the gray placeholder bars in the reference. Each card exposes the information needed to act on the plan: meal name, preparation time, servings, cost, ingredients, and instructions. The screen also includes a shopping-list view because it turns the generated plan into a practical next step and makes the catalog prices visible.

### Design decisions and deviations from Figma

The Figma layouts were reproduced with shared React Native components, the supplied visual assets, the Promo typography setup, and the reference colors and spacing. The iPhone status bar and Dynamic Island are not drawn as app content; they are left to the operating system. On desktop/web, the app uses a centered canvas capped at 480 points because the source design only specifies mobile frames.

I kept weekday ordering chronological even though the reference swaps Wednesday and Thursday. I also added functional selection, loading, error, empty, and disabled states where the design mainly showed the initial happy path. These states are important in a real app, particularly because recipe generation depends on network and model availability. The landing illustration uses the available local food assets and retains the existing “groceries pop out of the bag” animation; this was preferable to blocking the flow on missing final artwork.

The web budget control uses an accessible HTML range input, while iOS and Android use the native community slider. This preserves the intended visual control while allowing keyboard interaction on web. Option tiles, day tabs, buttons, and controls include explicit selection/disabled semantics rather than relying only on color.

More specifically, the main visible changes from the supplied five-screen reference are:

| Reference screen | Delivered implementation | Reason |
|---|---|---|
| Lander | Kept the MealPrep title, bag composition, green CTA, and entrance animation, but used the available local food PNGs rather than relying on the exact Figma emoji layers. | The supplied/available assets were more reliable across platforms and allowed the animation to remain functional. |
| Budget selection | Added the missing working €25–€150 slider, with the reference-style large budget amount and a default of €82. | The slider was explicitly left unspecified in the brief, so a native control was chosen for touch usability and a keyboard-accessible web adapter was added. |
| Dietary needs | Kept the two-column option grid and added real multi-select behavior, selected styling, and a disabled/enabled Continue state. | The reference shows the visual options but not the interaction model; dietary restrictions can naturally be combined. |
| Nutritional goals | Kept the two-column grid while making the selection functional and connecting Continue to generation, with loading and visible error states. | A static screen would not provide feedback when the generation service is unavailable. |
| Weekly meal plan | Replaced the gray placeholder content with real recipe cards containing meal metadata, ingredients, quantities, and steps; kept day navigation but used chronological Mon–Sun ordering. Added an estimated cost and shopping-list view. | The brief requires an actionable seven-day plan, and the shopping list connects the recipes to the supplied priced product catalog. The reference’s swapped Wednesday/Thursday order was treated as a visual inconsistency rather than product behavior. |

The weekly-plan screen is therefore the largest intentional divergence: the reference is a green-background visual mockup with placeholder lines, while the delivered screen prioritizes readable recipe content and practical use. The green visual language, title treatment, cost summary, day tabs, and large white content card remain the basis of the screen, but the card is populated and made responsive. On narrower screens, recipe content can scroll without being clipped; on desktop, the same mobile-oriented layout remains centered instead of stretching across the viewport.

### Data and generation workflow

The user’s budget, dietary choices, nutritional goal, and generated plan are kept in one Zustand store so navigation can preserve choices and the final screen can consume the same state without prop-drilling. The supplied product catalog is treated as the source of truth for ingredients and prices.

The LLM is not allowed to invent an unconstrained recipe list. The server workflow first filters eligible catalog products, searches recipe publishers, extracts recipe data from the same source page, and matches every required ingredient against catalog candidates. Recipes that omit required ingredients, substitute incompatible products, violate selected preferences, or exceed the budget are rejected. The scheduler aims for 14 meals (lunch and dinner for seven days), enforces variety and occurrence limits, and falls back to one meal per day when the budget cannot support two meals per day. If even that is impossible, the app reports the limitation instead of fabricating a plan.

The API key is kept server-side rather than exposed through the client bundle. Verified recipe results are cached temporarily in server memory to reduce repeated work while still allowing fresh discovery. Shopping-list quantities are aggregated by catalog product, with whole-pack costs rounded up and consumed fractions used for per-meal estimates. These are explicitly estimates from the supplied catalog, not live store quotations.

### Validation and known limitations

I validated TypeScript compilation, the web export, whitespace, responsive layouts at mobile and desktop sizes, slider mouse/keyboard behavior, back navigation with preserved choices, disabled/enabled actions, error visibility, weekday switching, and card positioning after resize. The meal-plan UI was checked with fixture data because live generation requires service configuration that is not present in the current environment.

For production, I would add the final font files and illustration assets, confirm final colors against the source Figma, deploy the server endpoint for native builds, and improve the generation screen with a skeleton, retry action, and more granular error recovery. Native-device rendering and reduced-motion behavior would also need a physical-device pass.

## B. One feature I would add next

**Replace-one-meal regeneration.**

A user should be able to tap “Replace” on an individual meal, optionally give a short reason such as “less expensive,” “no fish,” or “use ingredients I already have,” and regenerate only that meal while keeping the rest of the week unchanged. The replacement would reuse the existing budget, dietary, nutritional, catalog-matching, and validation pipeline, but reserve the cost of the other six days before selecting a candidate.

This is the highest-value next feature for this small flow because meal plans are personal and a single disliked or inconvenient meal should not force the user to restart onboarding or accept an otherwise good week. It also provides a focused way to demonstrate that the LLM workflow is controllable, budget-aware, and safe under partial updates. The existing shopping-list exclusion behavior would make the feature especially coherent: after a replacement, the list could be recomputed and the user could immediately see the cost impact.

---

*Implementation context: Expo SDK 57, React Native/React 19, Expo Router, TypeScript, Zustand, a server-side meal-plan endpoint, and the supplied product catalog. Detailed design differences and validation notes are recorded in `design-reference/IMPLEMENTATION.md`.*
