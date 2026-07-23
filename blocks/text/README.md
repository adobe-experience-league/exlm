# Text block

Lets authors write several text segments with **different horizontal alignments inside
a single block** — for example a centered sentence directly above a left-aligned
paragraph — without splitting them into separate sections (which adds unwanted spacing,
especially on Universal Editor pages).

## Content model

One row per text segment. Each row has two columns:

| Column 1 — alignment | Column 2 — text                                            |
| -------------------- | ---------------------------------------------------------- |
| `center`             | Your centered sentence goes here.                          |
| `left`               | And your left-aligned paragraph follows directly below it. |
| `right`              | A right-aligned note.                                      |

- **Alignment token** (column 1): one of `left`, `center`, `right`, `justify`.
  Matching is case- and whitespace-insensitive (`Center`, `CENTER` all work).
- **Text** (column 2): rich text — paragraphs, headings, links, lists, bold/italic —
  all preserved; only the horizontal alignment is applied.

### Defaults & edge cases

- Omit the alignment column (single-cell row) and the text renders at the default
  alignment (`left`).
- An unknown or empty token also falls back to the default.
- Empty segments are dropped, so no stray gaps appear.

## Notes

- Alignment is presentational only; heading/paragraph semantics are unchanged.
- The block sits within the standard content width; alignment holds across mobile,
  tablet, and desktop.
- A full Universal Editor authoring model (per-segment alignment as a select field) is
  a planned follow-up — see EXLM-5417.
