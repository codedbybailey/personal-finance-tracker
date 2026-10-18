# Bloom & Balance

A browser-based personal finance tracker built with HTML, CSS, and vanilla JavaScript. Add income and expenses, edit or delete entries, and review totals and spending charts.

## Run locally

From this folder, run `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765`. No build or package installation is required. Use the same browser and address each time to access your saved transactions. Serving the page over HTTP gives localStorage a consistent origin; storage behavior for directly opened `file:` URLs varies by browser.

## Using the tracker

Enter a description, a positive USD amount with up to two decimal places, a type, category, and date. Amounts can be as large as $999,999,999.99 per transaction. The type determines which categories are available. Dates from 1900 onwards are supported, including future entries; this version does not distinguish planned transactions from completed ones.

Current balance is total recorded income minus total recorded expenses. It is not a bank balance and does not include an opening balance unless you record one as income. All saved transactions contribute to the overview, including future dates. History sorts by date, newest first. Type and category filters apply only to history, with a separate empty state when nothing matches.

Select Edit to load an entry into the form, then save changes or cancel. Delete asks for confirmation. The category breakdown uses all expenses. The monthly chart groups income and expenses by calendar month in the selected year; expand “View monthly amounts” for exact values. Years with transactions and the current year are available. Both charts use all transactions, regardless of history filters.

## Storage and accuracy

Transactions are stored as JSON under `bloom-balance.transactions.v1` in localStorage. Amounts use integer cents, and decimal input converts directly into cents without multiplying a floating-point dollar amount. Totals that would exceed JavaScript's safe integer range are rejected.

Data stays in this browser profile and origin; there is no account, backend, bank connection, or device sync. Clearing site data removes saved entries. Multiple tabs do not merge changes, so use one tab for editing. Storage is not encrypted by the application. Private browsing may discard transactions when its session ends.

If a save fails, a notice explains that changes remain in the current tab. If saved data cannot be read or fails validation, the app leaves that data untouched and starts an unsaved session. Do not clear the browser data if you need to recover those records. There is no export or recovery interface yet.

## Files and design

- `index.html` contains the accessible dashboard, transaction form, filters, chart containers, and monthly data table.
- `style.css` defines reusable typography and color variables, responsive editorial layouts, focus states, and restrained button transitions.
- `script.js` handles transactions, validation, totals, localStorage, filtering, chart rendering, and optional entrance animation.

Combination B, Contemporary Art Magazine, uses Bodoni Moda for editorial headings, Manrope for interface text and financial values, and Noto Sans SC for Chinese accents. Financial values use tabular numerals. Deep jade and muted green provide text colors on warm ivory; soft jade marks boundaries and blush distinguishes expense bars. Charts include text labels and exact values so color is not the only cue.

Google Fonts uses preconnect and `display=swap`, with local fallback fonts. The only JavaScript dependency is the requested GSAP 3.13.0, loaded from jsDelivr. Entrance animations affect headings only and follow [GSAP's media-query guidance](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) to respect reduced motion. The tracker works if GSAP is unavailable. There are no floating petals, looping animations, or animated financial values. Fonts and GSAP require network access; local transaction behavior does not.

## Writing

Keep financial labels, form instructions, and errors literal. Use short messages such as “Transaction added.” Avoid unsupported financial claims, motivational filler, decorative punctuation, and formulaic contrasts. Keep Bloom & Balance's warmth in its name and editorial headings.

The writing review used [Anti-AI-Slop Writing](https://github.com/jalaalrd/anti-ai-slop-writing/blob/main/skills/anti-ai-slop-writing/SKILL.md), its [vocabulary reference](https://github.com/jalaalrd/anti-ai-slop-writing/blob/main/skills/anti-ai-slop-writing/references/banned-words.md), and [No AI Slop](https://github.com/petergyang/no-ai-slop/blob/main/skills/no-ai-slop/SKILL.md) with its [editing checks](https://github.com/petergyang/no-ai-slop/blob/main/skills/no-ai-slop/eval.md). Apply their guidance with minimal edits, preserving financial accuracy and accessible labels.

## Manual checks

Use a separate browser profile or test origin to avoid changing your own records. Add income of $100.00 and expenses of $0.10 and $0.20; verify income of $100.00, expenses of $0.30, and balance of $99.70. Refresh and confirm the entries remain. Edit an expense, change its type and category, then verify the updated totals and charts. Cancel another edit and confirm nothing changes. Cancel a deletion, then confirm one and refresh again.

Try each history filter, including a combination with no matches. Add records in different months and years and compare the chart with its monthly table. Test blank descriptions, zero or negative amounts, more than two decimal places, and missing dates. Check keyboard navigation, error focus, reduced motion, narrow layouts, and browser storage being unavailable. Confirm the tracker still works when the font and GSAP requests are blocked.
