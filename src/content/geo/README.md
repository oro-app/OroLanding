# GEO content and research publishing

`research.js` exports the research landing-page content and a collection of research
articles. The initial article is an **unpublished template**, with no study findings.
Keep it at `status: 'template'` until real evidence and the complete publication
requirements below are available.

Oro has no published research. The research index also has `noindex: true` and
is omitted from public discovery. There are no public navigation links to Research.
Keep that setting until a public research section with real reports is approved;
the Style guides directory and individual guides remain available at their URLs,
without a Style guides footer link.

Templates must have `noindex` metadata and must be excluded from the public research
index, sitemap, and discovery lists. A template being accessible at its path does
not make it a published report. Do not add its path to the index's `related` list.

## Research index fields

`RESEARCH_INDEX` uses these fields:

| Field | Shape | Purpose |
| --- | --- | --- |
| `path` | String | `/research` |
| `noindex` | Boolean | Keep `true` while the research section is unpublished |
| `title` | String | Unique SEO title |
| `description` | String | Search description |
| `h1` | String | Visible page heading |
| `category` | String | Visible category label |
| `answer` | Array of strings | Direct opening answer |
| `sections` | Array of section objects | Explanatory content |
| `related` | Array of internal paths | Relevant public pages |

A section has `heading` and optional `paragraphs` and `bullets`, each an array of
strings. Keep the index's statement that no reports have been published until a
report passes the publication gate.

## Research article fields

`RESEARCH_ARTICLES` is an array of article objects:

| Field | Shape | Purpose |
| --- | --- | --- |
| `path` | String | Stable `/research/<slug>` route |
| `status` | `'template'` or `'published'` | Publication gate |
| `title` | String | Unique SEO title |
| `description` | String | Search description |
| `h1` | String | Visible article title |
| `subtitle` | String | Short context or template notice |
| `summary` | String | Concise, evidence-based opening summary |
| `publicationDate` | Full UTC ISO timestamp or `null` | Actual publication date in `YYYY-MM-DDTHH:mm:ss.sssZ` format, for example `2026-10-03T14:00:00.000Z` |
| `sampleSize` | Positive integer or `null` | Count of the unit defined in the methodology |
| `dateModified` | ISO timestamp, optional | Actual substantive revision date; omit when unknown |
| `sampleUnit` | String, optional for templates | Label for the count, such as participants or observations; required for published reports |
| `studied` | String, optional for templates | Study question, scope, and observation period; required for published reports |
| `included` | String, optional for templates | Eligibility, selection, sampling unit, and exclusions; required for published reports |
| `methodology` | String | Source, selection, collection, measurement, and analysis details |
| `definitions` | Array of `{ term, definition }` | Terms used in the report |
| `keyFindings` | Array of strings | Findings supported by the study |
| `analysis` | Array of section objects | Detailed interpretation and supporting evidence |
| `limitations` | Array of strings | Limits on interpretation and generalization |
| `charts` | Array of `{ src, alt, caption }` | Optional study figures |
| `related` | Array of internal paths | Relevant public pages |

Chart `src` values must point to real, accessible assets. Supply useful `alt` text
that conveys the chart's result and a caption that identifies its measure, units,
sample, and relevant source or period. Check that the chart agrees with the report;
do not include decorative or placeholder figures that resemble real evidence.

The article renderer supplies its citation summary and CTA from the article and
shared page UI. Do not place invented author credentials, study dates, findings,
sample sizes, or company facts in the content to fill those surfaces.

## Publication gate

Before changing `status` to `'published'`:

1. Supply a valid full UTC ISO `publicationDate` in `YYYY-MM-DDTHH:mm:ss.sssZ`
   format with no future date, a positive integer `sampleSize`, nonempty `sampleUnit`, `studied`, `included`,
   `methodology`, and `summary` strings, and nonempty `keyFindings`, `limitations`,
   and `analysis` arrays. Each finding and limitation must contain real text;
   each analysis section needs a heading and text in its paragraphs or bullets.
   Keep the title, description, and heading complete and accurate. These are
   necessary publication fields; merely filling them in is not evidence of a study.
2. State the unit counted by `sampleSize`, how the sample was selected, collection
   dates, exclusions, definitions, measurement process, and analysis method. Make
   the source and basis of each finding traceable. Distinguish observation,
   interpretation, and uncertainty.
3. Confirm that Oro has permission to use and publish the source material. Review
   the privacy methodology for the actual source and output, including any
   consent, aggregation, anonymization, or disclosure requirements that apply.
   Document what was verified; do not claim privacy protections or consent without
   evidence that they apply to this study.
4. Review the analysis and charts against the underlying evidence. Describe
   selection effects, missing information, measurement limits, and other material
   limitations. Avoid presenting the sample as representative without support.
5. Replace every template notice and drafting instruction with the reviewed report.
   Update the index's empty-state copy only when a report is actually published.
   A future public research launch also requires removing the index's `noindex`
   flag and adding appropriate navigation after approval.
6. Run `npm run build` and inspect the rendered report, metadata, sitemap, and
   discovery output. Verify the report is included and remaining templates are
   still excluded and marked `noindex`.

For a new research article, add its exact path to `RESEARCH_PATHS` in
`src/lib/geoRoutes.js` as well as its record in `research.js`. The build checks
that content and runtime routing cover the same paths. Extend the GEO checks
when adding a route. The publication gate controls indexing and public listings;
keep templates out of related links.

Keep incomplete reports as templates. Do not publish synthetic findings or use
placeholder numbers, dates, charts, or privacy statements.
