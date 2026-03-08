Create a polished static mobile-first H5 game prototype named "奶茶封口王" (repo slug: wechat-h5-milk-tea-seal-rush).

Goal:
Build a WeChat-friendly viral-feeling mini game prototype that is easy to understand in 3 seconds, good for score bragging, replayable, and different from these existing loops:
- pure click survival
- pure dodge obstacle / flappy
- pure memory matching
- pure suika merge
- previous social-message judgment mini games

Game concept:
- Theme: chaotic milk tea shop rush hour / sealing takeaway drinks.
- One-sentence sell: 看准杯型和时机，在爆单传送带上疯狂封口，手一抖就翻车。
- Inspiration: fast reaction / timing challenge / score attack / short rounds common in WeChat H5 mini games.
- Innovation: not only timing; players must also recognize the correct lid color/type before tapping, so it's a dual-task "recognition + timing" challenge.

Core gameplay MVP:
- Mobile-first portrait layout.
- Cups move upward or horizontally on a conveyor toward a clearly highlighted sealing zone.
- Each cup visually indicates required lid type (at least 2 types, better 3 if still clean): e.g. blue = 冰饮盖, pink = 奶盖盖, yellow = 热饮盖.
- Player has big colored lid buttons at bottom.
- Tap correct lid button while cup is inside seal zone to score.
- Wrong lid or bad timing causes "翻车" penalties and combo break.
- Round lasts about 25-35 seconds.
- Difficulty ramps gradually.
- Combo, best score, current score, timer.
- Juice: streak feedback, shake, pop particles, punchy copy, fake order manager taunts, result title.
- Include a share-text generator / copy button with a funny brag line.

Must have files:
- index.html
- styles.css
- script.js
- README.md
- AGENTS.md
- DESIGN.md
- .github/workflows/deploy-pages.yml

Tech constraints:
- No build step, no npm install, no external dependencies.
- Must run by opening index.html or using python3 -m http.server.
- Keep code readable and self-contained.
- Include simple SVG/CSS/Canvas only if needed; avoid assets if possible.

Content requirements:
- README in Chinese, include game pitch, gameplay, local run, GitHub Pages deployment note.
- AGENTS.md brief repo guide for future agents.
- DESIGN.md with: game name, one-line sell, inspiration, innovation, core loop, rules, shareability, UI style, MVP scope.

Polish requirements:
- Visually appealing and playful, not raw prototype ugly.
- Strong mobile usability.
- Clear start / restart flow.
- Works without console errors.

Also do these repo chores:
- set local git config user.name to "OpenClaw Bot" and user.email to "bot@openclaw.local"
- make at least one commit with message: feat: initial milk tea sealing rush prototype
