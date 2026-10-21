---

paths:

  - 'src/**/*.spec.js'
  - 'src/__tests__/**'

---

# Testing

Use [Vitest](https://vitest.dev/) (`npm run test:unit`).

* Test pure logic first: title normalization, answer matching, score and speed-bonus calculation.
* Do not write end-to-end tests. Test multiplayer behavior by hand with two browser tabs.
* Do not mock Firebase or RAWG just to test components. Move the logic into plain functions and test those.
* Keep tests short: one behavior per test, explicit names, no shared fixtures unless needed.
* Run `npm run test:unit -- --run` and `npm run lint` before opening a pull request.
