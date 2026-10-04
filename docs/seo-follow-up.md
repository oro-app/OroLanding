# SEO follow-up, October 4, 2026

The user's Google first-page results for `ai stylist` did not contain Oro at the
time of review. This is one personalized search result, not proof that the site is
absent from Google's index. The currently signed-in Google Search Console account
shows the welcome screen, with no accessible site properties, so Google-selected
canonical URLs, index exclusions, impressions, and positions remain unverified.

## Changes

- Homepage search title: `Oro | AI Personal Stylist You Can Text`.
- Homepage description: `Oro is an AI personal stylist you can text. Get outfit
  recommendations from clothes you already own, tailored to your style and plans.`
- Matching OpenGraph/Twitter/fallback metadata and a factual home sitemap summary.
- `robots.txt` now advertises `https://www.askoro.now/sitemap.xml`, matching the
  existing canonical origin and every generated sitemap URL.

The homepage body, visible copy, layout, signup, header, and footer are unchanged.
No guide or research navigation links were added. No DNS, domain redirects,
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

1. Obtain access to an existing Search Console property or verify the site in the
   intended Google account. Inspect `/` and `/ai-personal-stylist`, submit the
   canonical sitemap, and request indexing only after checking the live response.
2. Decide whether to add contextual links from existing published articles. The
   guides form their own linked cluster with no incoming links from established
   site navigation. The user's instruction to keep the pages unlinked is preserved.
   Two specific link-only proposals, with the current visible words retained:
   - `the-cost-of-deciding.mdx`: “what to do with the clothes you already have”
     links to `/guides/style-clothes-you-already-own`.
   - `youre-always-dressing-for-someone.mdx`: “finds the combinations you haven't
     seen yet” links to `/ai-personal-stylist`.
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
