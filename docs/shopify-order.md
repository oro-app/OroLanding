# Shopify order page

`/order` is a single product-selection page using the site's header, checkout cards, button styles, and Oro tokens. It sells one unit of either configured product per order. Shopify owns product content, variants, prices, inventory, payment, shipping, taxes, and order emails. No products need to be declared in this repository. Payment takes place on Shopify's hosted checkout.

## Connect the existing store

1. In Shopify admin, add the **Headless** sales channel and create a storefront. Give its Storefront API access permission to read products and create carts. Copy its **public Storefront access token**, not an Admin API token or private token.
2. Make both products Active and publish them to that Headless storefront. Check their prices, inventory, images, variants, and shipping requirements.
3. Get each product's handle from its search engine listing URL (the portion after `/products/`).
4. In the existing Vercel project's Settings → Environment Variables, add these for Production and any Preview environments you intend to test:

   ```dotenv
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-public-storefront-token
   SHOPIFY_ORDER_PRODUCT_HANDLES=first-product-handle,second-product-handle
   ```

   Use the permanent `myshopify.com` domain, without `https://` or a trailing slash. These variables are read by `/api/order` on the server; do not prefix them with `VITE_`. Tokens do not belong in committed files.
5. Verify Shopify Payments/payment provider, shipping zones/rates, taxes, policies, and customer notifications in Shopify admin. Redeploy the Vercel project after adding the variables.
6. Open `/order` on the deployment. Check both products and available/sold-out variants. In Shopify test mode, complete a test order and verify the item, amount, shipping, taxes, confirmation, and inventory. Disable test mode before accepting real payments.

## Development and limits

The project's Vite development middleware serves `/api/order` using the production handler and loads `SHOPIFY_` variables from local env files on the server. Add the variables above to `.env`, then restart `npm run dev` after changing them. Do not commit local credentials.

Local product reads share in-flight requests and cache successful responses for 30 seconds. Publishing or editing a product can take up to that cache window to appear locally; restarting the dev server clears the cache. Failed reads are not cached. Checkout always rechecks Shopify directly. Local API errors include setup guidance; production responses stay generic. Local Shopify requests time out after five seconds.

The API pins Shopify Storefront version `2026-10`. It permits only the two configured products, validates the selected variant against Shopify, and creates a fresh one-item cart on explicit checkout submission. Shopify performs final inventory and pricing validation at checkout. Products with more than 100 variants are rejected rather than silently omitting options. This flow supports one-time purchases; subscriptions requiring selling plans need additional implementation.

No live store, payment, or deployment verification is implied by the repository checks.

References: [Shopify Storefront setup](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started), [cart and checkout](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage).
