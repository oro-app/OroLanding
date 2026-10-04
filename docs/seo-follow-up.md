# SEO follow-up, October 4, 2026

The user's Google first-page results for `ai stylist` did not contain Oro at the
time of review. This is one personalized search result, not proof that the site is
absent from Google's index. At the initial review, the signed-in Google Search
Console account showed the welcome screen with no accessible site properties.
The user subsequently approved verification and sitemap submission for
`https://www.askoro.now/`. Search Console results and submission evidence are
recorded under `outputs/oro-seo-audit` in the workspace.

## Changes

- Homepage search title: `Oro | AI Personal Stylist You Can Text`.
- Homepage description: `Oro is an AI personal stylist you can text. Get outfit
  recommendations from clothes you already own, tailored to your style and plans.`
- Matching OpenGraph/Twitter/fallback metadata and a factual home sitemap summary.
- `robots.txt` now advertises `https://www.askoro.now/sitemap.xml`, matching the
  existing canonical origin and every generated sitemap URL.
- The downloaded Google ownership verification file is retained at
  `public/googleed6f95a7b6af77aa.html` for the authorized URL-prefix property.
- Two user-approved contextual article links connect existing published content
  to the AI stylist guide and the guide to styling clothes already owned.

The homepage body, visible copy, layout, signup, header, and footer are unchanged.
No guide or research header/footer links were added. No Research links were added
to existing pages. No DNS, domain redirects,
firewall settings, or routing configuration changed. Cross-domain sitemaps are
supported; the old sitemap reference was an alignment issue, not a demonstrated
indexing blocker. Better titles and descriptions do not guarantee Google will
use that wording or rank the site for a particular query.

## Verification

The build prerenders 46 React routes and enriches six static legal pages. All
22 existing Node GEO checks pass. Emitted homepage title, description, social
metadata, canonical, robots directives, and sitemap origin were inspected.
The built homepage body still matches the saved original baseline byte for byte.
Live verification is recorded under `outputs/oro-seo-audit` in the workspace.

Before the changes, the homepage, both AI stylist guides, robots, sitemap, and
assets returned HTTP 200 for both ordinary and Googlebot smartphone user-agent
requests, without an observable challenge. A user-agent probe does not establish
access from actual Google IPs or prove crawling/indexing. Unknown URLs still return
the homepage with HTTP 200, an existing issue for a separate routing change.

## Remaining work

1. Inspect `/` and `/ai-personal-stylist` in the authorized Search Console property,
   submit the canonical sitemap, and request indexing after checking the live
   response. Keep the verification file deployed to retain verified ownership.
2. Check discovery and rankings after Google processes the newly connected guide
   cluster. The approved links preserve the current visible article words:
   `the-cost-of-deciding.mdx` links “what to do with the clothes you already have”
   to `/guides/style-clothes-you-already-own`; `youre-always-dressing-for-someone.mdx`
   links “finds the combinations you haven't seen yet” to `/ai-personal-stylist`.
3. After reviewing Google's selected canonicals, consider consolidation of the
   older public domain. Both hosts still serve the site, with canonical metadata
   pointing to `www.askoro.now`; no domain migration was performed.
4. Use Search Console impressions/clicks/positions to assess progress. Useful
   original content and relevant editorial references can build discoverability;
   no backlinks, ranking outcome, or timing have been fabricated or promised.

Primary references: [Google title guidance](https://developers.google.com/search/docs/appearance/title-link),
[sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview),
[internal link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable),
[canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
and [URL Inspection](https://support.google.com/webmasters/answer/9012289).
