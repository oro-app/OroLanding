# Analytics Events

Google Analytics is configured in `analytics.js`. Events only emit after the user accepts analytics cookies.

| Metric tracked | GA event emitted | Where it fires | Key params |
| --- | --- | --- | --- |
| Page views | `page_view` | Initial route load, accepted cookie banner, browser history/hash changes | `page_title`, `page_location`, `page_path`, `route_type`, `newsletter_slug`, `consent_source` |
| Page navigation/link changes | `page_navigation` | Link clicks and programmatic `/try-oro` navigation | `from_path`, `to_path`, `destination_url`, `link_text`, `link_target`, `navigation_type`, `is_external`, `transport_type` |
| Start the conversation CTA | `start_conversation_click` | Hero "start the conversation" button | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| Video play | `video_play_click` | Film poster/play button | `location`, `video_provider`, `video_id`, `video_src` |
| Newsletter open | `newsletter_open` | Newsletter article route when a valid newsletter loads | `newsletter_slug`, `newsletter_title`, `newsletter_date` |
| Newsletter percent read | `percent_read` | Newsletter article scroll depth at 25%, 50%, 75%, and 100% | `percent_read`, `newsletter_slug`, `newsletter_title` |
| Mailing-list CTA | `join_mailing_list_click` | Home journal CTA, Play Store modal CTA, journal archive subscribe form | `location`, `time_from_landing_ms`, `is_first_cta_click` |
| Mailing-list signup success | `newsletter_signup` | Waitlist modal after a successful email signup | `method` |
| Community CTA | `join_community_click` | Oro Insiders "join our community" button | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| Try Oro CTA | `try_oro_click` | Bottom-of-page CTA and footer CTA | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| App Store CTA | `app_store_click` | `/try-oro` App Store button, newsletter article App Store CTA, legacy hero App Store CTA | `location`, `store`, `destination`, `destination_url`, `time_from_landing_ms`, `is_first_cta_click` |
| Google Play CTA | `google_play_click` | `/try-oro` Google Play button | `location`, `store`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
| First CTA timing | `first_cta_click` | First tracked CTA click per browser session | `cta_event_name`, `time_from_landing_ms`, `is_first_cta_click`, plus original CTA params |
| External social link clicks | `external_social_link_click` | External links to Instagram, TikTok, LinkedIn, or Linktree | `platform`, `destination_url`, `link_text`, `link_target`, `location` |
| Generic subpage Try Oro CTAs | `cta_click` | `/how-it-works` and `/why-oro` Try Oro buttons | `location`, `destination`, `time_from_landing_ms`, `is_first_cta_click` |
