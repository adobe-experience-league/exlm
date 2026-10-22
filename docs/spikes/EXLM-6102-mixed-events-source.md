# Trade-offs for Mixed Events Source (EXLM-6102)

Business-facing trade-off doc for [EXLM-6102](https://jira.corp.adobe.com/browse/EXLM-6102).  
Wiki: [Trade-offs for Mixed Events Source](https://wiki.corp.adobe.com/spaces/ExpLeague/pages/4071106546/Trade-offs+for+Mixed+Events+Source)

**Paste into Confluence:** open [`EXLM-6102-mixed-events-source.html`](./EXLM-6102-mixed-events-source.html) in a browser → select from the title through revision history (skip the yellow box) → Copy → Paste → Publish.

**Conclusion:** Do not adopt Upcoming-from-CDN + On-Demand-from-Coveo as the main architecture. Keep both on Coveo for Hub and search; CDN JSON is legacy/secondary only (optional promo strip).
