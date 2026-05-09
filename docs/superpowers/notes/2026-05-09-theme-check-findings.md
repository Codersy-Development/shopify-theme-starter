# Theme Check Findings — 2026-05-09

Captured during the build & tooling cleanup. These findings are NOT fixed in this sub-project; they feed sub-projects 2 (JS), 3 (Liquid sections), and 4 (snippets).

## Raw Output

```

> shopify-theme-starter@1.0.0 theme:check
> shopify theme check

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/cart-drawer.liquid                                                 │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.all_products_collection_url }} instead of       │
│  hardcoding /collections/all                                                 │
│                                                                              │
│  89  <a href="/collections/all" class="text-sm font-medium text-gray-900     │
│  underline" data-close>                                                      │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.cart_url }} instead of hardcoding /cart         │
│                                                                              │
│  111  href="/cart"                                                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/footer.liquid                                                      │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.root_url }} instead of hardcoding /             │
│                                                                              │
│  5  <a href="/" class="inline-block mb-4 no-underline" title="{{ shop.name   │
│  }}">                                                                        │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/header.liquid                                                      │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.root_url }} instead of hardcoding /             │
│                                                                              │
│  8  <a href="/" class="text-xl font-bold text-gray-900 no-underline          │
│  shrink-0" title="{{ shop.name }}">                                          │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.search_url }} instead of hardcoding /search     │
│                                                                              │
│  183  <a href="/search" class="text-gray-700 hover:text-gray-900             │
│  no-underline" aria-label="Search">                                          │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.cart_url }} instead of hardcoding /cart         │
│                                                                              │
│  227  href="/cart"                                                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/main-404.liquid                                                    │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.root_url }} instead of hardcoding /             │
│                                                                              │
│  6  href="/"                                                                 │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/main-cart.liquid                                                   │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.cart_url }} instead of hardcoding /cart         │
│                                                                              │
│  6  <form action="/cart" method="post">                                      │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.all_products_collection_url }} instead of       │
│  hardcoding /collections/all                                                 │
│                                                                              │
│  71  href="/collections/all"                                                 │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/main-search.liquid                                                 │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.search_url }} instead of hardcoding /search     │
│                                                                              │
│  5  <form action="/search" method="get" role="search" aria-label="Product    │
│  search" class="mb-8">                                                       │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'paginate' used.                                             │
│                                                                              │
│  50  <a href="{{ paginate.previous.url }}" class="px-4 py-2 border           │
│  rounded-lg hover:bg-gray-50 no-underline text-gray-700">Previous</a>        │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'paginate' used.                                             │
│                                                                              │
│  49  {% if paginate.previous %}                                              │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'paginate' used.                                             │
│                                                                              │
│  53  <a href="{{ paginate.next.url }}" class="px-4 py-2 border rounded-lg    │
│  hover:bg-gray-50 no-underline text-gray-700">Next</a>                       │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'paginate' used.                                             │
│                                                                              │
│  52  {% if paginate.next %}                                                  │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'paginate' used.                                             │
│                                                                              │
│  47  {% if paginate.pages > 1 %}                                             │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  snippets/canonicals.liquid                                                  │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Use one of the asset_url filters to serve assets for better performance.    │
│                                                                              │
│  29  <link rel="canonical" href="{{ shop.url }}{{ collection.url }}">        │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Use one of the asset_url filters to serve assets for better performance.    │
│                                                                              │
│  33  <link rel="canonical" href="{{ shop.url }}{{ blog.url }}">              │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Use one of the asset_url filters to serve assets for better performance.    │
│                                                                              │
│  39  <link rel="canonical" href="{{ shop.url }}">                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  snippets/json-ld.liquid                                                     │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  15  {%- if settings.social_facebook_link != blank -%}{%- assign             │
│  social_links = social_links | push: settings.social_facebook_link -%}{%-    │
│  endif -%}                                                                   │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  16  {%- if settings.social_instagram_link != blank -%}{%- assign            │
│  social_links = social_links | push: settings.social_instagram_link -%}{%-   │
│  endif -%}                                                                   │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  17  {%- if settings.social_tiktok_link != blank -%}{%- assign social_links  │
│   = social_links | push: settings.social_tiktok_link -%}{%- endif -%}        │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  18  {%- if settings.social_x_link != blank -%}{%- assign social_links =     │
│  social_links | push: settings.social_x_link -%}{%- endif -%}                │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  19  {%- if settings.social_youtube_link != blank -%}{%- assign              │
│  social_links = social_links | push: settings.social_youtube_link -%}{%-     │
│  endif -%}                                                                   │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  20  {%- if settings.social_pinterest_link != blank -%}{%- assign            │
│  social_links = social_links | push: settings.social_pinterest_link -%}{%-   │
│  endif -%}                                                                   │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  56  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  primary_collection.title | push: product.title -%}                          │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  56  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  primary_collection.title | push: product.title -%}                          │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  56  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  primary_collection.title | push: product.title -%}                          │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  57  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  primary_collection.url | push: product.url -%}                              │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  57  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  primary_collection.url | push: product.url -%}                              │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  57  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  primary_collection.url | push: product.url -%}                              │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  59  {%- assign crumbs = crumbs | push: shop.name | push: product.title -%}  │
│                                                                              │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  59  {%- assign crumbs = crumbs | push: shop.name | push: product.title -%}  │
│                                                                              │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  60  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  product.url -%}                                                             │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  60  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  product.url -%}                                                             │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  64  {%- assign crumbs = crumbs | push: shop.name | push: collection.title   │
│  -%}                                                                         │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  64  {%- assign crumbs = crumbs | push: shop.name | push: collection.title   │
│  -%}                                                                         │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  65  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  collection.url -%}                                                          │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  65  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  collection.url -%}                                                          │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  68  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  article.blog.title | push: article.title -%}                                │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  68  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  article.blog.title | push: article.title -%}                                │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  68  {%- assign crumbs = crumbs | push: shop.name | push:                    │
│  article.blog.title | push: article.title -%}                                │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  69  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  article.blog.url | push: article.url -%}                                    │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  69  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  article.blog.url | push: article.url -%}                                    │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  69  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  article.blog.url | push: article.url -%}                                    │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  72  {%- assign crumbs = crumbs | push: shop.name | push: page.title -%}     │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  72  {%- assign crumbs = crumbs | push: shop.name | push: page.title -%}     │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  73  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  page.url -%}                                                                │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'push' used.                                                 │
│                                                                              │
│  73  {%- assign crumb_urls = '' | split: '' | push: shop.url | push:         │
│  page.url -%}                                                                │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  snippets/predictive-search.liquid                                           │
│                                                                              │
│                                                                              │
│  [warning]: HardcodedRoutes                                                  │
│  Use routes object {{ routes.search_url }} instead of hardcoding /search     │
│                                                                              │
│  24  <form action="/search" method="get" role="search" class="border-b       │
│  border-gray-100">                                                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  templates/gift_card.liquid                                                  │
│                                                                              │
│                                                                              │
│  [error]: ImgWidthAndHeight                                                  │
│  Missing width and height attributes on img tag                              │
│                                                                              │
│  18        <img                                                              │
│  19          src="{{ gift_card | qr_code }}"                                 │
│  20          alt="Gift card QR code"                                         │
│  21          class="mx-auto mb-6 w-40 h-40"                                  │
│  22        >                                                                 │
│                                                                              │
│                                                                              │
│  [error]: ImgWidthAndHeight                                                  │
│  Missing height attribute on img tag                                         │
│                                                                              │
│  47  <img src="{{ 'gift-card/add-to-apple-wallet.svg' | shopify_asset_url    │
│  }}" alt="Add to Apple Wallet" width="120">                                  │
│                                                                              │
│                                                                              │
│  [error]: UnknownFilter                                                      │
│  Unknown filter 'qr_code' used.                                              │
│                                                                              │
│  19  src="{{ gift_card | qr_code }}"                                         │
│                                                                              │
│                                                                              │
│  [error]: TranslationKeyExists                                               │
│  'gift_cards.issued.title' does not have a matching entry in                 │
│  'locales/en.default.json'                                                   │
│                                                                              │
│  6  <title>{{ 'gift_cards.issued.title' | t }} — {{ shop.name }}</title>     │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Use one of the asset_url filters to serve assets for better performance.    │
│                                                                              │
│  19  src="{{ gift_card | qr_code }}"                                         │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  Theme Check Summary.                                                        │
│                                                                              │
│  55 files inspected with 54 total offenses found across 10 files.            │
│  34 errors.                                                                  │
│  20 warnings.                                                                │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

```

## Triage Notes

(Empty — to be filled in when sub-project 2 starts. Categorize findings into: real bugs, performance issues, accessibility issues, deprecations, false positives.)
