export function fetchQuestions(count) {
  const params = new URLSearchParams({
    discover: true,
    page_size: 40,
    page: 1 + Math.floor(Math.random() * 6),
    key: import.meta.env.VITE_RAWG_API_KEY,
  });

  return fetch(`https://api.rawg.io/api/games/lists/popular?${params}`)
    .then((response) => {
      if (!response.ok) throw new Error(`RAWG a répondu ${response.status}`);
      return response.json();
    })
    .then(({ results }) => {
      // On écarte les jeux sans image (sinon capture cassée) et ceux réservés aux adultes.
      const games = results.filter(
        (game) => game.background_image && game.esrb_rating?.slug !== "adults-only",
      );

      games.sort(() => Math.random() - 0.5); // On mélange

      // On garde `count` jeux.
      return games.slice(0, count).map((game) => ({
        title: game.name,
        imageUrl: game.background_image,
      }));
    });
}

export function normalizeTitle(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // é → e
    .toLowerCase()
    .replace(/['’]/g, "") // baldur's → baldurs
    .replace(/[^a-z0-9]+/g, " ") // ponctuation et espaces multiples → un seul espace
    .trim();
}

const RANK_BONUS = [50, 30, 10];

function words(text) {
  return normalizeTitle(text).split(" ").filter(Boolean);
}

// Jusqu'à 100 points, partagés entre les mots du titre : 100 / 8 = 12,5 par mot pour « The Legend of Zelda: Breath of the Wild ».
// L'ordre des mots ne compte pas.
export function computePoints(answer, title) {
  const titleWords = words(title);
  const remaining = words(answer);
  const found = titleWords.filter((word) => {
    const index = remaining.indexOf(word);
    if (index === -1) return false;
    remaining.splice(index, 1); // Un mot de la réponse ne compte qu'une fois : « the the the » ne vaut pas plus que « the ».
    return true;
  }).length;
  if (found === 0) return 0;
  return Math.round((100 * found) / titleWords.length);
}

// Points de la manche { uid: points } : mots trouvés, plus 50/30/10 pour les trois premiers à avoir trouvé le titre complet.
// answers : [{ uid, text, submittedAt }]
export function scoreRound(answers, title) {
  const points = {};
  let rank = 0;
  [...answers]
    .sort((a, b) => a.submittedAt - b.submittedAt)
    .forEach(({ uid, text }) => {
      const base = computePoints(text, title);
      points[uid] = base === 100 ? base + (RANK_BONUS[rank++] ?? 0) : base;
    });
  return points;
}
