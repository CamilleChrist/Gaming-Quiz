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
