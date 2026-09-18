# Page performance — storage, retention, cleanup, parallelism

Weekly Lighthouse agent. Config is [`config.json`](config.json). Workflow is `.github/workflows/page-performance.yaml`. Dummy demo with a green Actions run: https://github.com/nitin-rachabathuni/exlm-page-performance-demo (full FAQ in that repo’s `READOUT.md`).

The XML under `performance/fixtures/` is **test data only** (`demo.example` URLs). The weekly job does not read it.

---

## Which URLs are tested?

**One hub page per type**, not a random 20 from the sitemap.

`select: onePerType` + `pageTypes` in `config.json`. After English include / search exclude, the job picks **the shortest path** (`withinType: hub`) that matches each type:

| id            | Matches (English)                    |
| ------------- | ------------------------------------ |
| home          | `/en` or `/en/home`                  |
| browse        | `/en/browse`                         |
| events        | `/en/events` (not `/en/docs/events`) |
| playlists     | `/en/playlists`                      |
| perspectives  | `/en/perspectives`                   |
| courses       | `/en/courses`                        |
| certification | `/en/certification*`                 |
| docs          | `/en/docs`                           |

A type with no sitemap hit is skipped. Omit `maxUrls` — the cap **is** the number of unique types that matched (today: up to 8). Add a type by appending `{ "id", "match" }` — no script change.

---

## Where are reports stored?

**GitHub Actions artifacts** on that workflow run. Open Actions → the run → **Artifacts**. They are not committed, not on `gh-pages`, not on AEM.

| Artifact                   | Contents                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| `page-performance-plan`    | `plan.json` (includes `selectedByType`), selected URLs, per-shard URL lists |
| `page-performance-shard-N` | That shard’s Lighthouse HTML + `summary.json`                               |
| `page-performance-summary` | Merged `summary.md` + `summary.json`                                        |

The same markdown is pasted into the run’s **job summary** (Type column when `onePerType` ran). Local laptop copies live in gitignored `performance-reports/` (`npm run performance:clean`).

**What’s in `summary.md`:** Type, URL, Device, Status, Score, **FCP / LCP / CLS / TBT / Speed Index / TTFB**. No transfer-size **Bytes** column. Below the table: **Run suggestion** (what to do this week), **Insights summary** (repeated Lighthouse opportunities on low scores), **Low scores** (per-row reasons). INP is stored in JSON when Lighthouse emits it; lab runs usually show TBT instead.

---

## How many days?

From `performance/config.json`:

| Knob                    | Value  | Effect                                                                                       |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `artifactRetentionDays` | **45** | GitHub deletes the blob after 45 days (platform max 90)                                      |
| `keepLastRuns`          | **8**  | Cleanup job keeps the 8 newest runs; older `page-performance-*` artifacts are deleted sooner |

---

## How are they auto-cleaned?

1. **TTL** — `upload-artifact` `retention-days: 45`. GitHub deletes them even if the workflow is not running.
2. **Keep last 8** — after a successful summarize, **Delete old artifacts** lists `page-performance-*`, groups by run id, `DELETE`s older runs. Only that job has `actions: write`.
3. **Local** — `npm run performance:clean`.
4. **Manual** — artifact trash in the Actions UI, or `gh api -X DELETE repos/adobe-experience-league/exlm/actions/artifacts/<id>`.

---

## How are they processed in parallel?

```
discover (1 job)
  → fetch sitemap index, then matching child sitemaps (sitemapConcurrency: 4)
  → English include skips the other 18 locale files before download
  → one hub URL per page type (~8), split round-robin into 4 shards
audit (4 jobs at once, fail-fast: false)
  → URL i → shard i % 4
  → ~8 URLs × mobile+desktop ≈ 16 Lighthouse runs
  → concurrencyPerShard: 1 (one Chrome per VM)
summarize (1 job) → cleanup (1 job)
```

If one shard crashes, the others still finish. Summarize **fails closed** if a planned shard has no `summary.json`.

**When:** YAML ticks **hourly**. A gate job then matches **repository variables** (Settings → Secrets and variables → Actions → **Variables** — not a git secret):

| Variable                      | Default     | Effect                                                                                                                                        |
| ----------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `PAGE_PERFORMANCE_SCHEDULE`   | `0 8 * * 1` | 5-field UTC cron. YAML ticks at minute **0** each hour; GitHub may start late, so the gate matches hour/day/month/weekday and ignores minute. |
| `PAGE_PERFORMANCE_ENABLED`    | on (empty)  | Soft pause: `false` skips **scheduled** runs. **Run workflow** still works.                                                                   |
| `PAGE_PERFORMANCE_SKIP_UNTIL` | unset       | Soft skip until that ISO date (`2026-10-01`).                                                                                                 |

Hard stop (disable the workflow in the Actions UI) and “skip only the next run” can be a follow-up ticket. Concurrency is `cancel-in-progress: false` so an hourly no-op cannot cancel a still-running weekly audit.

**GitHub App vs Actions?** A GitHub App could own cron and pause flags. Extra ops (app install, private key, host). Actions + repo variables is the same control. Stay on Actions unless org policy forbids hourly no-op gate ticks.

**Scores do not fail the week** (report-only). Missing shard or crash does.

**Add a page type:** edit `pageTypes` in `config.json`. No script change.
