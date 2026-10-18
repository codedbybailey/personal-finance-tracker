# Bloom & Balance

A personal finance tracker built with HTML, CSS, and vanilla JavaScript.

Open `index.html` in a browser to view the typography foundation. The starting HTML, CSS, and JavaScript files were empty. This page contains the title, overview heading, and activity empty state; transaction entry, storage, and calculations are not implemented. `script.js` remains empty.

## Typography and color

Combination B, Contemporary Art Magazine, uses Bodoni Moda for the page title and overview heading. Manrope handles English body text, interface labels, and future financial values. Noto Sans SC handles Chinese text, including the small 收支 (income and expenses) accent. Google Fonts loads all three families with preconnect and `display=swap`; local fallback fonts keep text readable while they load or if the request fails.

Reusable font and type-size variables live in `style.css`. Apply `.financial-value` or `.transaction-amount` to amounts and `.chart-label` to chart labels when implementing those features. These classes use Manrope with tabular numerals.

Deep jade and muted green provide text colors on warm ivory. Soft jade marks the activity boundary; blush appears in text selections. The overview uses two columns on wider screens and one column on smaller screens. There are no animations or floating petals.

## Writing

Keep financial labels, form instructions, and errors literal. Use short messages such as “Transaction added.” and “Enter an amount greater than zero.” only when the relevant behavior exists. Avoid unsupported financial claims, motivational filler, decorative punctuation, and formulaic contrasts. Keep Bloom & Balance’s warmth in its name and editorial headings.

The writing review used [Anti-AI-Slop Writing](https://github.com/jalaalrd/anti-ai-slop-writing/blob/main/skills/anti-ai-slop-writing/SKILL.md), its [vocabulary reference](https://github.com/jalaalrd/anti-ai-slop-writing/blob/main/skills/anti-ai-slop-writing/references/banned-words.md), and [No AI Slop](https://github.com/petergyang/no-ai-slop/blob/main/skills/no-ai-slop/SKILL.md) with its [editing checks](https://github.com/petergyang/no-ai-slop/blob/main/skills/no-ai-slop/eval.md). Apply their guidance with minimal edits, preserving technical accuracy and accessible labels.
