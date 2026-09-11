import type { DietaryNeed, NutritionalGoal } from '../lib/types';

export interface RecipeIngredient {
  id: string;
  name: string;
  quantityLabel: string;
  // Only reviewed equivalents. Missing catalog entries must never be replaced
  // by a keyword match (e.g. carrot juice instead of carrots).
  productIds: string[];
}

export interface Recipe {
  id: string;
  name: string;
  sourceName: string;
  recipeUrl: string;
  imageUrl: string;
  prepTimeMinutes: number;
  servings: number;
  calories: number | null;
  dietaryNeeds: DietaryNeed[];
  preferredGoals: NutritionalGoal[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

const ingredient = (id: string, name: string, quantityLabel: string, ...productIds: string[]): RecipeIngredient =>
  ({ id, name, quantityLabel, productIds });
const goodFood = 'https://www.bbcgoodfood.com/recipes/';
const photos = 'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/';

// Reviewed against the linked recipe pages on 2026-09-11. Quantities and
// servings stay together; preparation is summarized in our own words.
// Photos come from those pages, never from a separate image search.
export const recipes: Recipe[] = [
  {
    id: 'pesto-pasta', name: 'Pesto pasta', sourceName: 'Good Food',
    recipeUrl: `${goodFood}easy-pesto-pasta`,
    imageUrl: `${photos}recipe-image-legacy-id-327725_12-a882af2.jpg`,
    prepTimeMinutes: 5, servings: 6, calories: 336,
    dietaryNeeds: ['none', 'pescatarian'], preferredGoals: ['low_sugar', 'low_fat', 'low_salt'],
    ingredients: [
      ingredient('spaghetti', 'Spaghetti', '500 g', '3560070500406'),
      ingredient('basil-pesto', 'Basil pesto', '3 tbsp', '8019730079981'),
      ingredient('parmesan', 'Parmesan', '50 g', '8005821030566'),
    ],
    steps: ['Cook the spaghetti for the time stated on its packet.', 'Drain and mix with the pesto and half the Parmesan.', 'Divide between plates and add the rest of the Parmesan.'],
  },
  {
    id: 'blue-cheese-pasta', name: 'Blue cheese pasta', sourceName: 'Good Food',
    recipeUrl: `${goodFood}blue-cheese-pasta`,
    imageUrl: `${photos}recipe-image-legacy-id-4327_10-c878fb3.jpg`,
    prepTimeMinutes: 20, servings: 4, calories: 554,
    dietaryNeeds: ['none', 'veggie', 'pescatarian'], preferredGoals: ['low_sugar'],
    ingredients: [
      ingredient('penne', 'Penne pasta', '400 g', '8000139931192'),
      ingredient('butter', 'Butter', '25 g', '8000633019204'),
      ingredient('onion', 'Onion', '1 piece'), ingredient('garlic', 'Garlic', '1 clove'),
      ingredient('dried-sage', 'Dried sage', '1 tsp'), ingredient('stilton', 'Stilton cheese', '100 g'),
      ingredient('walnuts', 'Walnuts, toasted', '1 handful', '8003100897145'),
    ],
    steps: ['Cook the penne. Meanwhile, soften the sliced onion in melted butter until golden.', 'Add crushed garlic and sage; cook for two minutes, then take off the heat.', 'Drain the pasta, saving some water. Combine with the onions, cubed Stilton and two tablespoons of pasta water. Finish with chopped toasted walnuts.'],
  },
  {
    id: 'cheesy-tuna-pesto-pasta', name: 'Cheesy tuna pesto pasta', sourceName: 'Good Food',
    recipeUrl: `${goodFood}cheesy-tuna-pesto-pasta`,
    imageUrl: `${photos}recipe-image-legacy-id-21156_11-39999c8.jpg`,
    prepTimeMinutes: 25, servings: 4, calories: 696,
    dietaryNeeds: ['none', 'pescatarian'], preferredGoals: ['high_protein'],
    ingredients: [
      ingredient('penne', 'Penne pasta', '400 g', '8000139931192'),
      ingredient('tuna-in-olive-oil', 'Yellowfin tuna in olive oil', '200 g', '8001120810038'),
      ingredient('basil-pesto', 'Basil pesto', '190 g', '8019730079981'),
      ingredient('cheddar', 'Cheddar', '100 g'), ingredient('cherry-tomatoes', 'Fresh cherry tomatoes', '250 g'),
    ],
    steps: ['Cook the penne and turn the grill to high.', 'Combine the tuna, including its oil, with pesto. Add a third of the grated cheddar and the halved tomatoes.', 'Mix in the drained pasta, transfer to a shallow ovenproof dish and cover with the remaining cheddar. Grill for three to four minutes, until the cheese melts.'],
  },
  {
    id: 'avocado-toast', name: 'Avocado Toast', sourceName: 'Love and Lemons',
    recipeUrl: 'https://www.loveandlemons.com/avocado-toast-recipe/',
    imageUrl: 'https://cdn.loveandlemons.com/wp-content/uploads/2020/01/how-to-make-avocado-toast.jpg',
    prepTimeMinutes: 4, servings: 2, calories: null,
    dietaryNeeds: ['none', 'veggie', 'vegan', 'pescatarian', 'dairy_free'], preferredGoals: [],
    ingredients: [ingredient('avocado', 'Ripe avocado', '1 piece'), ingredient('lemon', 'Lemon', '1 wedge'), ingredient('sea-salt', 'Sea salt', 'to taste'), ingredient('bread', 'Bread for toast', '4 slices', '8030582702544')],
    steps: ['Toast the bread. Halve and pit the avocado, then dice the flesh inside the peel.', 'Squeeze lemon over the avocado and add sea salt.', 'Spoon onto the toast and roughly mash with a fork. The source also offers optional topping variations.'],
  },
  {
    id: 'kidney-bean-curry', name: 'Kidney bean curry', sourceName: 'Good Food',
    recipeUrl: `${goodFood}kidney-bean-curry`, imageUrl: `${photos}kidney-bean-curry-f8e0b17.jpg`,
    prepTimeMinutes: 35, servings: 2, calories: 282,
    dietaryNeeds: ['none', 'veggie', 'vegan', 'pescatarian', 'gluten_free', 'dairy_free'],
    preferredGoals: ['low_fat', 'low_salt'],
    ingredients: [
      ingredient('vegetable-oil', 'Vegetable oil', '1 tbsp', '8002330009861'),
      ingredient('onion', 'Onion', '1 piece'), ingredient('garlic', 'Garlic', '2 cloves'),
      ingredient('ginger', 'Fresh ginger', '1 thumb-sized piece', '00000409'), ingredient('coriander', 'Fresh coriander', '1 small pack'),
      ingredient('cumin', 'Ground cumin', '1 tsp'), ingredient('paprika', 'Ground paprika', '1 tsp'),
      ingredient('garam-masala', 'Garam masala', '2 tsp'),
      ingredient('canned-tomatoes', 'Canned chopped tomatoes', '400 g', '3560071245412'),
      ingredient('kidney-beans', 'Canned kidney beans in water', '400 g'),
      ingredient('basmati-rice', 'Basmati rice, cooked (to serve)', 'as needed', '8019514040145'),
      ingredient('sea-salt', 'Sea salt', 'to taste'),
    ],
    steps: ['Soften the chopped onion in the oil over low to medium heat with a pinch of salt. Add garlic, ginger and coriander stalks for two minutes.', 'Stir in cumin, paprika and garam masala for one minute. Add tomatoes and the beans with their canning water; bring to a boil.', 'Simmer gently for 15 minutes to thicken. Adjust seasoning and serve with cooked basmati rice and coriander leaves.'],
  },
  {
    id: 'baked-salmon', name: 'Baked salmon', sourceName: 'Good Food',
    recipeUrl: `${goodFood}baked-salmon`, imageUrl: `${photos}salmon_0-ad51cb9.jpg`,
    prepTimeMinutes: 20, servings: 4, calories: 354,
    dietaryNeeds: ['none', 'pescatarian', 'gluten_free', 'dairy_free'],
    preferredGoals: ['high_protein', 'low_carbs', 'low_sugar', 'low_salt'],
    ingredients: [
      ingredient('salmon', 'Skinless salmon fillets', '4 fillets'),
      ingredient('olive-oil', 'Olive oil', '1 tbsp', '8034034680848'),
      ingredient('herbs', 'Chopped herbs (optional)', 'to serve'), ingredient('lemon', 'Lemon', 'to serve (optional, sliced)'),
      ingredient('long-stem-broccoli', 'Steamed long-stem broccoli (optional)', 'to serve'),
      ingredient('sea-salt', 'Sea salt', 'to taste'), ingredient('black-pepper', 'Black pepper', 'to taste', '8003240061086'),
    ],
    steps: ['Set the oven to 180°C, or 160°C fan. Coat the fillets with olive oil and season.', 'Arrange in an ovenproof dish. Cover for tender fish or leave uncovered for a lightly roasted surface.', 'Bake for 10–15 minutes, until opaque and flaking easily. The source suggests herbs, lemon slices and steamed long-stem broccoli as optional accompaniments.'],
  },
];
