---

paths:

  - 'src/services/rawg.js'

---

# RAWG API

Documentation: https://rawg.io/apidocs

* All RAWG calls live in `src/services/rawg.js`, separate from components.
* The API key comes from `VITE_RAWG_API_KEY` in `.env.local`. Never commit it or hard-code it. Do not claim a key already exists: the user creates their own on rawg.io.
* Fetch all questions of a game in one batch at the start, not one call per round.
* Pick games from varied genres, never the same game twice in a game, and make difficulty progressive when it stays simple.
* Handle loading, API errors and missing screenshots (fall back to another game or screenshot).
* Normalize titles before comparing: lowercase, trim, remove punctuation and extra spaces.
* Keep the normalization and scoring functions pure so they can be unit tested.
