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
