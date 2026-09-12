import json, re
with open('data/product_catalog_en.json', encoding='utf-8') as f:
    catalog = json.load(f)
products = catalog if isinstance(catalog, list) else catalog.get('products', [])
terms = re.compile(r'parmesan|parmigiano|grana|breadcrumb|breadcrumbs|pangrattato|gluten|vegan|dairy|plant|rice|corn|chickpea|lentil', re.I)
for product in products:
    if terms.search(json.dumps(product)):
        print(json.dumps({'name': product.get('name'), 'department': (product.get('department') or {}).get('name'), 'allergens': product.get('allergens'), 'price': product.get('price'), 'id': product.get('id')}))
