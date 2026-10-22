# Trade-offs for Mixed Events Source (EXLM-6102)

Spike findings for [EXLM-6102](https://jira.corp.adobe.com/browse/EXLM-6102).  
**Paste-ready Confluence wiki markup:** [EXLM-6102-mixed-events-source-wiki.txt](./EXLM-6102-mixed-events-source-wiki.txt)  
**Corp wiki target:** [Trade-offs for Mixed Events Source](https://wiki.corp.adobe.com/spaces/ExpLeague/pages/4071106546/Trade-offs+for+Mixed+Events+Source)

## Recommendation

**Do not** implement Upcoming-from-CDN + On-Demand-from-Coveo as the forward architecture. Keep Coveo as the single source of truth for both types on Events Hub, site search, browse, and V2 rails. Keep CDN JSON as legacy only; finish migrating `upcoming-event` / `events-cards` off it.

**Acceptable compromise:** Coveo SoT everywhere + optional CDN-only promo-window strip if PdM hard-requires promo semantics Coveo does not index yet.

## Preview

- Events Hub: https://exlm-6102--exlm--adobe-experience-league.aem.page/en/events?martech=off
- Site search: https://exlm-6102--exlm--adobe-experience-league.aem.page/en/search?martech=off

(No product behavior change on this branch — research docs only. Preview is the all-Coveo baseline.)

## Today’s sources (summary)

| Surface                          | Upcoming               | On-Demand      |
| -------------------------------- | ---------------------- | -------------- |
| Events Hub (`events-search`)     | Coveo Headless         | Coveo Headless |
| `/search` (Atomic)               | Coveo (stale excluded) | Coveo          |
| `upcoming-event-v2`              | Coveo REST             | —              |
| `upcoming-event`, `events-cards` | CDN JSON (legacy)      | —              |

CDN feed (v3): `promoStartTime` / `promoEndTime` / `eventStartTime`. Legacy adaptor still expects `startTime` / `endTime` / `time` — schema drift.

Full tables, use cases, and decision matrix are in the wiki markup file.
