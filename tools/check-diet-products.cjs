const catalog = require('../data/product_catalog_en.json');
const products = Array.isArray(catalog) ? catalog : catalog.products || [];
const terms = /parmesan|parmigiano|grana|breadcrumb|breadcrumbs|pangrattato|gluten|vegan|dairy|plant|rice|corn|chickpea|lentil/i;
for (const product of products) {
  const text = JSON.stringify(product);
  if (terms.test(text)) {
    console.log(JSON.stringify({ name: product.name, department: product.department?.name, allergens: product.allergens, price: product.price, id: product.id }));
  }
}
