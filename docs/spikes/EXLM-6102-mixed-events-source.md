# Trade-offs for Mixed Events Source (EXLM-6102)

Spike findings for [EXLM-6102](https://jira.corp.adobe.com/browse/EXLM-6102).  
**Corp wiki:** [Trade-offs for Mixed Events Source](https://wiki.corp.adobe.com/spaces/ExpLeague/pages/4071106546/Trade-offs+for+Mixed+Events+Source)

## How to paste into Confluence (important)

Confluence Cloud **does not render** classic wiki markup (`h1.`, `{panel}`) or raw Markdown when you paste them as text. That is why the `.txt` / `.md` files looked broken.

**Use the HTML file instead:**

1. Open [`EXLM-6102-mixed-events-source.html`](./EXLM-6102-mixed-events-source.html) in a browser (double-click or File → Open).
2. Select from the page title through the revision history (skip the yellow “How to put this on wiki” box).
3. Copy → paste into the Confluence page editor → Publish.

Or open the local file:

`file:///Users/nitin/Documents/adobe/exlm/docs/spikes/EXLM-6102-mixed-events-source.html`

## Recommendation

**Do not** implement Upcoming-from-CDN + On-Demand-from-Coveo as the forward architecture. Keep Coveo as the single source of truth for both types on Events Hub, site search, browse, and V2 rails. Keep CDN JSON as legacy only.

## Preview

- Events Hub: https://exlm-6102--exlm--adobe-experience-league.aem.page/en/events?martech=off
- Site search: https://exlm-6102--exlm--adobe-experience-league.aem.page/en/search?martech=off

## Files in this spike

| File                                     | Use                                                                |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `EXLM-6102-mixed-events-source.html`     | **Paste this into Confluence** (open in browser → copy → paste)    |
| `EXLM-6102-mixed-events-source.md`       | Repo summary / this note                                           |
| `EXLM-6102-mixed-events-source-wiki.txt` | Legacy Confluence wiki markup — **do not paste** into Cloud editor |
