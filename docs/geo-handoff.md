# Oro GEO implementation handoff

Implementation branch: `codex/geo-cornerstone`, based on main `33a4689`.
Working copy: `/Users/sunny/oro-workspace/oro-landing-geo`.
The separate existing checkout and its untracked files were left untouched.
This change is local and has not been deployed.

## Architecture and initial audit

OroLanding uses React 18, Vite, plain JSX, Tailwind and Oro Kit. There is no router
library: `src/App.jsx` selects a route from the pathname. The build renders React
at build time using `src/entry-server.jsx`, then `scripts/generate-seo.mjs` emits
route-specific static HTML, metadata, JSON-LD, a sitemap and `llms.txt`. Production
uses the existing Vercel static-file precedence and SPA fallback.

Existing editorial content uses MDX newsletters. This addition uses ordinary data
modules and a shared article renderer, without a CMS, database or new dependency.

The frozen homepage is controlled by `src/components/home/Home.jsx`, `HomeChrome.jsx`,
`Home.css`, its demo components, `useHomeMotion.js`, `GoldBackground`, global styles,
Oro Kit, and existing logo/image assets. `src/App.jsx` mounts that same tree.
Signup lives in the existing beta and get-started components and API handlers.
All of those visible components, styles, links and signup code remain unchanged.

Before implementation, the plan was to touch three existing integration files:
`src/App.jsx` for new route selection; `src/lib/seo.js` for invisible metadata;
and `scripts/generate-seo.mjs` for prerendering and discovery. The baseline was
built and saved before those source changes, including desktop/mobile screenshots
and text, links, layout and signup-review captures.

## What was added

Ten distinct answer-first guides, each with useful context, concrete examples,
common mistakes where relevant, personalization limits, an Oro beta CTA and
two to four relevant guide links. No new links or content were added to the homepage.
The article shell uses existing Oro typography, colors and controls; its new CSS
is scoped to GEO classes and loaded only for those pages.

A conservative research index and one visibly unpublished research template.
The template contains no participant data, numerical findings, publication date,
sample size, charts, or privacy assurances. It receives `noindex,follow`, is excluded
from sitemap and `llms.txt`, and is not linked from the public research index.

## Every new route

| Route | Status |
| --- | --- |
| `/ai-personal-stylist` | Indexable guide |
| `/ai-stylist-you-can-text` | Indexable guide |
| `/what-to-wear/job-interview` | Indexable guide |
| `/what-to-wear/first-date` | Indexable guide |
| `/what-to-wear/first-day-of-work` | Indexable guide |
| `/what-to-wear/brunch` | Indexable guide |
| `/dress-codes/business-casual` | Indexable guide |
| `/dress-codes/smart-casual` | Indexable guide |
| `/guides/style-clothes-you-already-own` | Indexable guide |
| `/guides/i-have-clothes-but-nothing-to-wear` | Indexable guide |
| `/research` | Indexable research index |
| `/research/how-people-choose-outfits` | Unpublished, noindexed template |

No category indexes or About page were added: the ten guides, their related links,
and the research index provide the initial content layer without extra thin pages.

## Every existing file modified

| File | Why |
| --- | --- |
| `src/App.jsx` | Recognize exact new route paths, lazy-load the shared GEO page, and select the existing Halo theme for those new pages. The home branch renders the same tree. |
| `src/lib/seo.js` | Add the canonical entity description, align Organization social identities with the existing main-branch homepage links, add factual text-stylist software markup and GEO page metadata. |
| `scripts/generate-seo.mjs` | Prerender new pages with their CSS, include only indexable pages in discovery, and replace stale app-first LLM summary claims with the canonical text-stylist positioning. |

No homepage component, stylesheet, navigation configuration, footer configuration,
signup component, API handler, dependency file, robots source or Vercel configuration
was modified. `App.jsx` is a homepage integration file; its additions select only
new routes. The homepage's metadata graph changes invisibly through `seo.js`.

New implementation files: `src/lib/geoRoutes.js`, `src/lib/geoContent.js`,
`src/content/geo/guides.js`, `src/content/geo/research.js`,
`src/content/geo/README.md`, `src/components/geo/GeoPage.jsx` and `GeoPage.css`.
New checks: `test/geo-content.test.js`, `test/geo-prerender.test.js`, `e2e/geo.spec.js`.

## Entity and structured data

Canonical positioning: **Oro is the AI personal stylist you can text. It learns
your style and wardrobe and helps you decide what to wear.**

The existing Organization graph now includes that description. Its `sameAs` links
match the homepage's existing Instagram `askoro.now`, LinkedIn `askoro` and
X `askoro_now` links. Existing legal company name, logo and identity URLs are preserved.

The homepage and two entity guides include a text-stylist `SoftwareApplication`
with name, stable ID, description, category, URL and publisher. It adds no pricing,
operating system, ratings, reviews, awards or statistics. Each guide includes
`Article`, `WebPage` and `BreadcrumbList` markup. The research index and unpublished
template have page/breadcrumb markup, without a fabricated research Article.
Real published research can receive Article markup and its actual publication date.
No FAQ markup was added.

Existing product pages still describe an app, outfit planner, virtual try-on and
download/sign-in flow. Existing FAQ copy calls Oro an AI stylist app. Historical
newsletters use personal styling app language. These visible descriptions were
reported and preserved. Legacy product-page software markup retains its old
iOS/Android and CAD 0 offer; verify its relevance before a separate revision.
The previous `llms.txt` Android-in-progress and unverified privacy/pricing claims
were removed from that invisible summary.

## Crawlability and canonical strategy

Eleven indexable new routes are added to the generated sitemap. The unpublished
template is deliberately omitted. `llms.txt` includes the canonical entity statement,
guides and research index, and will include research reports only after publication.
New content is present in static HTML without JavaScript. New pages have unique
titles, descriptions, canonical paths and OpenGraph titles/descriptions.
Undated guides do not receive a fabricated sitemap modification date.

Every canonical and generated discovery URL keeps the existing origin
`https://www.askoro.now`. Robots directives, DNS, redirects and domain strategy
are unchanged. Existing `Allow: /` permits crawling of new routes and the template's
noindex directive. Do not disallow the template in robots: crawlers need to fetch
it to see noindex. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

`llms.txt` is supplementary documentation. Google says ordinary helpful-content,
indexing and crawlability practices also apply to its AI search features; special
AI markup or text files are not required. No ranking or citation outcome is promised.
[Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

## Domain audit and approval items

Live read-only HTTP checks on October 3, 2026 found:

| Host | Current behavior |
| --- | --- |
| `buildingoro.ca` | 308 to `www.buildingoro.ca`, preserving paths and queries |
| `www.buildingoro.ca` | 200; same homepage HTML as `www.askoro.now`; canonical points to `www.askoro.now` |
| `askoro.now` | 308 to `www.askoro.now`, preserving paths and queries |
| `www.askoro.now` | 200; self-canonical |

Both robots files advertise `https://buildingoro.ca/sitemap.xml`; sitemap entries
use `www.askoro.now`. Static legal source files contain older canonicals, but the
existing build correctly replaces them with `www.askoro.now` in deployed HTML.
Unknown paths receive the homepage with HTTP 200, an existing soft-404 behavior.

The split domain signals can make consolidation and crawl discovery less clear.
Recommended for explicit approval: redirect the older www host to the already
configured canonical host, align robots sitemap discovery with that host, and
design genuine 404 handling. Review Vercel domains and CDN/firewall access before
deployment. These recommendations have not been implemented.

Other changes requiring approval remain deferred: existing homepage/product-copy
revisions, new homepage navigation/footer links, signup changes, and unverified
product/company claims. No such approval is needed to review this additive branch.

After an approved deployment, inspect the exact new URLs and raw HTML on Vercel,
check sitemap reachability on the chosen host, run the deployment-only tests and
use Search Console URL Inspection/Rich Results Test. This local verification does
not establish production indexing, crawler-firewall access or Vercel route responses.

## Research publishing and information needed

The data model supports title, subtitle, publication timestamp, study question,
inclusion criteria, sample size and unit, methodology, definitions, key findings,
limitations, analysis, charts, related research, citation summary and the shared CTA.
See `src/content/geo/README.md` for the authoring workflow and field shapes.

Indexing requires `status: 'published'`, a valid nonfuture full UTC ISO timestamp,
positive sample size, explicit sample unit, study and inclusion descriptions,
complete metadata/summary/methodology, nonempty findings/limitations, and real
analysis sections. Invalid or incomplete reports stay noindexed and undiscoverable.
This technical gate does not certify evidence or privacy compliance.

Needed before a real report: verified data sources/access, permission to publish,
privacy and consent methodology, sampling unit and eligibility, collection dates,
event definitions, traceable findings, limitations and editorial review. Confirm
which legacy app/pricing claims remain relevant and who owns future editorial review.
No founder biographies, partner identities, traction or company history were invented.

## Suggested next ten guides (not built)

This is an editorial backlog based on gaps in the current set, without claims
about search volumes or ranking potential:

1. `/what-to-wear/wedding-guest` — start with the invitation, venue, cultural context and host expectations.
2. `/what-to-wear/networking-event` — balance approachability, workplace norms and standing comfort.
3. `/what-to-wear/work-dinner` — move from daytime work clothes to an evening setting.
4. `/what-to-wear/rainy-day` — plan weather protection around clothes already owned.
5. `/what-to-wear/airport` — consider temperature changes, movement and the destination.
6. `/dress-codes/cocktail-attire` — interpret an invitation without rigid gender formulas.
7. `/dress-codes/black-tie` — distinguish the host's expectations from flexible personal choices.
8. `/guides/make-an-outfit-more-casual` — explain practical swaps and their effect.
9. `/guides/style-one-piece-three-ways` — demonstrate repeatable combinations from a real closet.
10. `/guides/build-a-week-of-outfits` — plan around weather, laundry, comfort and upcoming occasions.

## Potential research reports (no findings invented)

Only pursue these if the product can lawfully and reliably capture the relevant
events. Conversational wording needs validated coding and appropriate permission.

| Possible report | Evidence needed | Main interpretation limit |
| --- | --- | --- |
| Occasions that prompt the most outfit questions | Tagged styling requests and a documented denominator | Request frequency does not establish which occasion is hardest |
| What people mean by "more casual" | Consented refinement messages, coded requested changes, coding agreement | Meaning depends on setting and culture |
| How recommendations change before acceptance | Recommendation versions and explicit accept/reject events | Silence or conversation end is not acceptance |
| Which pieces are swapped by occasion | Explicit item replacement events and occasion context | A swap is not necessarily dislike of the item |
| Comfort constraints in outfit decisions | Voluntarily stated comfort needs and documented coding rules | Missing statements do not mean no constraint |
| Wardrobe gaps versus combination problems | Coded requests tied to user-confirmed available clothes | Unrecorded clothes cannot be treated as missing |
| Outfit repetition in actual wardrobe use | Explicit worn/repeat confirmation and observation window | A recommended outfit is not proof it was worn |
| How preferences change across settings | Repeated requests with consent, context and adequate observations | Avoid inferring sensitive traits or causal effects |

## Verification results

`npm run build` passes: 42 React routes prerendered and six static legal pages
enriched. No lint or typecheck scripts exist in this plain-JSX repository.
`npm run test:feedback` passes all 41 tests; `npm run test:beta` passes all 75.
`node --test test/geo-content.test.js test/geo-prerender.test.js` passes all 16
content, publication-gate and emitted-artifact checks.

The new GEO browser suite passes all 23 tests and checks all twelve routes on desktop and six representative
routes on mobile, raw answer-first HTML, unique metadata and canonicals, related
links, no-JavaScript reading/styles, console/page errors, assets, overflow and
beta welcome/phone/back navigation with no submission.

The unchanged homepage was compared at 1440×1000 and 390×844 with deterministic
count responses, declined analytics consent and settled fonts/images. Ten captures
(hero, full page, footer, signup phone and signup review at both widths) have zero
differing pixels. Text, links, controls, headings, image dimensions, layout rectangles,
page heights and signup fields/consent match. No browser errors or API mutations
occurred. The final build's entire homepage `<body>` is also byte-identical to the
saved baseline; only invisible head metadata/assets differ.

Evidence lives in `/Users/sunny/oro-workspace/outputs/oro-geo-verification`, including
`comparison-report.json`, baseline/after screenshots and new-page screenshots.

The full inherited `npm run e2e` was run against the local preview: **87 passed,
57 failed, 13 skipped**. It is not a clean gate: it includes stale UI expectations,
local preview limitations and existing flow assertions. Two representative home
failures reproduce on the untouched saved baseline (heading text spacing across
an existing line break; an old "Join the beta" expectation versus "get her number").
Remaining inherited failures were not exhaustively diagnosed or repaired in this
additive change. See `existing-e2e.log` and `baseline-existing-e2e.log` in the evidence
directory. Deployment-only checks are skipped locally, so they still need a Vercel
preview after approval to deploy.

Vite preview serves clean article URLs through its SPA fallback; for raw route-specific
metadata verification locally, use the generated directory URL with a trailing slash,
such as `/ai-personal-stylist/`. Canonicals remain the existing slashless paths.
Production existing routes were audited to receive their own prerendered metadata;
new production routes should be verified on deployment. No redirects were added to
work around the local preview behavior.

Before deployment, the environment recommends updating the outdated Vercel CLI
with `npm i -g vercel@latest`. The CLI was not changed by this task.
