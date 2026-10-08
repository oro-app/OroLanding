# Analytics Events

Google Analytics is configured in `analytics.js`. Events only emit after the user accepts analytics cookies.

| Metric tracked | GA event emitted | Where it fires | Key params |
| --- | --- | --- | --- |
| Page views | `page_view` | Initial load on every route, accepted cookie banner, browser history/hash changes | `page_title`, `page_location`, `page_path`, `route_type`, `newsletter_slug`, `consent_source` |
| Page navigation/link changes | `page_navigation` | Internal and external link clicks on every route | `from_path`, `to_path`, `destination_url`, `link_text`, `link_target`, `navigation_type`, `is_external`, `transport_type` |
| Get oro's number CTA | `get_number_click` | Homepage header, hero, closing CTA, and newsletter article CTA | `location`, `destination`, `device_class`, `time_from_landing_ms`, `is_first_cta_click` |
| Text handoff open/close | `text_handoff_open`, `text_handoff_close` | Desktop QR handoff modal | `location`, `method` |
| Message app open | `message_app_open` | Mobile CTA or desktop phone-number fallback | `location`, `method` |
| Style goal choices | `style_goal_plan_better_outfits`, `style_goal_look_professional_at_work`, `style_goal_expand_my_wardrobe`, `style_goal_evolve_my_style`, `style_goal_wear_my_clothes_more` | Matching "What's your style goal?" footer link on the homepage | `goal`, `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| Newsletter open | `newsletter_open` | Newsletter article route when a valid newsletter loads | `newsletter_slug`, `newsletter_title`, `newsletter_date` |
| Newsletter percent read | `percent_read` | Newsletter article scroll depth at 25%, 50%, 75%, and 100% | `percent_read`, `newsletter_slug`, `newsletter_title` |
| Mailing-list CTA | `join_mailing_list_click` | Journal archive subscribe form | `location`, `time_from_landing_ms`, `is_first_cta_click` |
| Mailing-list signup success | `newsletter_signup` | Newsletter signup modal after a successful email signup | `method` |
| Try oro CTA | `try_oro_click` | Site footer CTA | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| App Store CTA | `app_store_click` | `/try-oro` App Store button | `location`, `store`, `destination`, `destination_url`, `time_from_landing_ms`, `is_first_cta_click` |
| Google Play CTA | `google_play_click` | `/try-oro` Google Play button | `location`, `store`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| First CTA timing | `first_cta_click` | First tracked CTA click per browser session | `cta_event_name`, `time_from_landing_ms`, `is_first_cta_click`, plus original CTA params |
| External social link clicks | `external_social_link_click` | External links to Instagram, TikTok, LinkedIn, or Linktree | `platform`, `destination_url`, `link_text`, `link_target`, `location` |
| Generic subpage Try oro CTAs | `cta_click` | `/how-it-works` and `/why-oro` Try oro buttons | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
