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

// Accepte le titre complet ou sa partie principale : « The Witcher 3 » pour « The Witcher 3: Wild Hunt ».
export function isCorrectAnswer(answer, title) {
  const given = normalizeTitle(answer);
  if (given === "") return false;

  const mainTitle = title.split(/[:(]/)[0];
  return given === normalizeTitle(title) || given === normalizeTitle(mainTitle);
}

// 100 points pour une bonne réponse, plus un bonus de rapidité : jusqu'à 50 points selon le temps restant.
export function computePoints(answer, title, secondsLeft, secondsPerRound) {
  if (!isCorrectAnswer(answer, title)) return 0;
  return 100 + Math.round((50 * secondsLeft) / secondsPerRound);
}
