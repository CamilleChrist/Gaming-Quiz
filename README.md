# Gaming Quiz

Quiz gaming multijoueur en ligne : devine le titre d'un jeu vidéo à partir d'une capture d'écran, seul ou jusqu'à 6 joueurs.

Projet de démo pour mon portfolio, qui m'a aussi servi à apprendre Vue.js 3.

> **Statut : en cours de développement.** L'interface et le multijoueur ne sont pas encore implémentés.

## Le jeu

1. Saisis un pseudo (pas de compte, pas d'inscription).
2. Crée une partie ou rejoins-en une avec un code ou un lien d'invitation.
3. Dans le salon, l'hôte attend les joueurs puis lance la partie.
4. À chaque manche, une capture d'écran apparaît : tape le titre du jeu avant la fin du chrono.
5. La bonne réponse est révélée, les points sont attribués et le classement s'affiche.
6. À la fin des manches, le gagnant est annoncé.

Les parties et les scores sont temporaires : rien n'est sauvegardé une fois la partie terminée.

## Technologies

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`), [Vue Router](https://router.vuejs.org/) et [Vite](https://vite.dev/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database) pour la synchronisation en temps réel, et [Firebase Hosting](https://firebase.google.com/docs/hosting) pour l'hébergement, sur le forfait gratuit (pas de serveur dédié)
- [API RAWG](https://rawg.io/apidocs) pour les jeux et les captures d'écran
- [Tailwind CSS](https://tailwindcss.com/) pour le style, JavaScript (sans TypeScript)
- [Vitest](https://vitest.dev/) pour les tests unitaires

## Installation

Prérequis : Node.js `^22.18.0` ou `>=24.12.0`.

```sh
npm install
npm run dev
```

L'application est servie sur `http://localhost:5173`.

### Configuration

Copie `.env.example` en `.env.local` et renseigne :

- les clés de ton projet [Firebase](https://console.firebase.google.com/) (`VITE_FIREBASE_*`)
- une clé gratuite [RAWG](https://rawg.io/apidocs) (`VITE_RAWG_API_KEY`)

`.env.local` ne doit jamais être commité. Comme il n'y a pas de serveur, ces valeurs sont incluses dans le code envoyé au navigateur.

> Le fichier `.env.example` sera ajouté avec l'intégration de Firebase et de RAWG.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm run test:unit` | Tests unitaires (Vitest) |
| `npm run lint` | Vérifie et corrige le code (oxlint + ESLint) |
| `npm run format` | Formate `src/` avec Prettier |

## Déploiement

Le site et la base de données sont hébergés sur Firebase (forfait gratuit Spark).

```sh
npm run build
firebase deploy
```

> Le fichier `firebase.json` et les règles `database.rules.json` seront ajoutés avec l'intégration de Firebase.

## Structure

```
src/
  main.js        point d'entrée de l'application
  App.vue        composant racine
  router/        routes de l'application
  __tests__/     tests unitaires
public/          fichiers statiques
```

Les dossiers `components/`, `views/` et `services/` seront ajoutés au fur et à mesure.

## Limites connues

Sans serveur, la logique du jeu (chrono, scores, révélation de la réponse) s'exécute dans le navigateur de l'hôte. Un joueur déterminé pourrait tricher en modifiant ses données. C'est acceptable pour une démo entre amis, mais pas pour un jeu compétitif.

## Licence

Projet personnel de démonstration.
