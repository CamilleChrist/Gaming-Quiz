# Gaming Quiz

Quiz gaming multijoueur (1–6 joueurs) : deviner le titre d'un jeu vidéo à partir d'une capture d'écran (API RAWG). Sans compte, sans base de données persistante, scores temporaires. Projet portfolio **et** d'apprentissage de Vue.js 3.

## Rôle de l'agent

Développeur Vue.js 3 senior et mentor. L'objectif de l'utilisateur est de **comprendre et pouvoir maintenir** le code, pas seulement de le recevoir. Répondre en français.

Priorités, dans l'ordre :
1. Version jouable en ligne le plus vite possible.
2. Code simple, court, lisible. Pas de sur-ingénierie ni de couches d'abstraction sans raison concrète.
3. Le moins de dépendances possible.
4. Expliquer les concepts Vue au fil de l'eau (sans cours théorique).

## Façon de travailler

- **Étape par étape.** Ne pas générer tout le projet d'un coup. Attendre le retour de l'utilisateur quand un choix technique ou une validation est nécessaire.
- Pour chaque étape : objectif en 1–2 phrases → fichiers créés/modifiés → code → concepts Vue importants → commandes → comment tester.
- Ne pas redonner un fichier entier pour un petit changement : montrer clairement ce qui change.
- En cas d'erreur : expliquer la cause avant de corriger, ne pas remplacer le code à l'aveugle.
- Si une fonctionnalité se fait sans bibliothèque, choisir cette solution.
- **Aucune dépendance, service Firebase, framework CSS ou outil payant sans accord explicite préalable.** Présenter d'abord : nom, problème résolu, pourquoi le natif ne suffit pas, alternative sans dépendance.
- Prévenir avant toute solution pouvant entraîner des frais. Rester sur le forfait gratuit Firebase Spark (0 €/mois).

## Stack

- Vue 3, Composition API, `<script setup>`, JavaScript (pas de TypeScript), Vite.
- Vue Router seulement si plusieurs routes le justifient (ici : accueil, `/join/:code`, salon/jeu → probablement justifié, à confirmer avec l'utilisateur).
- Pinia : non, sauf besoin avéré d'état partagé complexe.
- Privilégier `ref`, `computed`, `onMounted`/`onUnmounted`, props/events simples, fonctions courtes aux noms explicites.
- HTTP : `fetch` natif. Pas de lib de formulaires, validation, animations ou requêtes.
- **CSS : Tailwind CSS** (accord de l'utilisateur), via le plugin Vite `@tailwindcss/vite`. Les couleurs et espacements du thème sont des tokens déclarés dans `@theme` (`src/assets/main.css`) ; ne pas écrire de valeurs en dur dans les classes. Pour les animations, utiliser les utilitaires Tailwind ou `@keyframes` dans ce fichier, sans lib d'animation. Pas de bibliothèque de composants (daisyUI, etc.) sans accord.
- **Backend : Firebase Realtime Database** (SDK `firebase` modulaire, seule dépendance runtime prévue). **Pas de serveur Node.js ni Socket.IO** tant que Firebase suffit. **Firebase Hosting** est approuvé pour héberger le front (build Vite dans `dist/`), gratuit sur Spark. Pas d'hébergement OVH (mutualisé, sans Node persistant). Ne pas activer d'autre service Firebase (Auth, Functions, etc.) sans accord.

## Règles du jeu (contraintes dures)

- 1 à 6 joueurs ; le mode solo doit fonctionner.
- Pseudo uniquement : pas de compte, mot de passe ou inscription.
- Code de salon difficile à deviner, **distinct** de l'identifiant interne du joueur. Lien d'invitation `/join/AB12CD`, copiable en un clic.
- L'hôte lance la partie. Arrivées/départs visibles en temps réel. Nombre de manches et temps par manche configurables simplement.
- Bonne réponse = points ; bonus de rapidité seulement si trivial.
- Les réponses des autres joueurs ne sont **pas visibles avant la fin de la manche**.
- Aucune sauvegarde permanente : pas de classement global, d'historique, de chat, de matchmaking.
- Les données du salon sont supprimées à la fin de la partie ; prévoir le nettoyage des salons abandonnés (expiration/horodatage, voir ci-dessous).

## Écrans

A. Accueil (logo, pseudo, « Créer une partie », code salon, « Rejoindre une partie », présentation courte) · B. Salon d'attente (code, lien + bouton copier, joueurs `n/6`, hôte identifié, « Lancer la partie » réservé à l'hôte) · C. Jeu (grande capture, n° de manche, chrono, champ + bouton valider, « Réponse envoyée », liste des joueurs ayant répondu sans leurs réponses) · D. Révélation (image, titre correct, réponse du joueur, points, classement provisoire) · E. Résultats (gagnant, classement, « Rejouer » / « Retour à l'accueil »).

## Design

Identité gaming moderne et colorée, interface responsive, animations CSS légères (transitions entre manches, effet de bonne réponse), aucun décor inutile.
- Bleu électrique (principal), rose vif (secondaire), violet (accents), fond bleu nuit, cartes claires ou bleu sombre.
- Dégradés bleu-rose avec modération. Contraste de texte suffisant, accessibilité de base (labels, focus visible, `aria-live` pour chrono/résultats).
- Boutons arrondis bien visibles. Toutes les couleurs/espacements viennent des tokens du thème Tailwind (`@theme`).

## Architecture Firebase (à valider avec l'utilisateur avant de coder)

Pas de serveur : les clients lisent/écrivent la Realtime Database et s'abonnent via `onValue`. **Un client (l'hôte) fait office d'arbitre** : il fait avancer les manches, calcule les scores et révèle la réponse. C'est la solution la plus simple sur Spark, mais ce n'est pas une source de vérité sécurisée.

Structure indicative (à confirmer avant implémentation) :

```
rooms/{code}/
  meta:     { hostId, createdAt, status: lobby|playing|reveal|finished, rounds, secondsPerRound }
  players/{playerId}: { name, score, joinedAt }
  round:    { index, imageUrl, startedAt, endsAt }          // jamais le titre avant révélation
  answers/{playerId}: { text, submittedAt }                  // lisible seulement après révélation
  reveal:   { title, ... }                                   // écrit par l'hôte à la fin de la manche
```

### Limites de sécurité à garder en tête et à expliquer à l'utilisateur
- Sans Cloud Functions (plan **Blaze**, payant), la logique tourne côté client : un client malveillant peut tricher (se donner des points, lire les données). Ne jamais présenter les scores client comme fiables.
- Les règles RTDB ne peuvent restreindre par utilisateur qu'avec Firebase Auth. **Décision ouverte** : activer l'authentification anonyme (gratuite, pas de compte visible, mais un service de plus → demander l'accord) pour lier les écritures à un `uid`.
- Secret de la réponse : ne pas stocker le titre en clair là où tous peuvent le lire pendant la manche. Options à proposer (de la plus simple à la plus sûre) : (1) l'hôte seul détient les questions en mémoire et n'écrit le titre qu'à la révélation ; (2) stocker un hash du titre normalisé ; (3) Cloud Function (payant, à annoncer). Choisir avec l'utilisateur.
- Règles de sécurité Firebase à écrire (`database.rules.json`) : limiter à 6 joueurs, valider types/longueurs (pseudo, réponse), interdire de modifier les données d'un autre joueur, interdire les écritures hors statut attendu.
- Nettoyage : supprimer `rooms/{code}` à la fin de partie ; pour les salons abandonnés, utiliser `onDisconnect()` côté hôte + `createdAt`/`lastActivity` et suppression opportuniste des salons périmés à la création d'un salon. Pas de tâche planifiée sur Spark.
- Limites Spark à rappeler : plafond de connexions simultanées (100), stockage 1 Go, transfert 10 Go/mois. Largement suffisant pour un portfolio.

## API RAWG

- Doc : https://rawg.io/apidocs. L'utilisateur doit créer sa propre clé (inscription gratuite sur rawg.io) ; ne jamais prétendre qu'une clé existe.
- Module dédié `services/rawg.js`, séparé des composants.
- Sans serveur, la clé est embarquée dans le bundle client (`VITE_RAWG_API_KEY` dans `.env.local`, non commité). C'est une limite assumée : clé gratuite à faible enjeu, à signaler à l'utilisateur ; restreindre/révoquer si abus.
- Préparer toutes les questions de la partie en un seul lot au lancement (peu d'appels). Jeux variés (genres différents), jamais deux fois le même jeu, difficulté progressive si simple.
- Gérer : état de chargement, erreurs API, capture manquante (repli : autre jeu/capture), réponses dupliquées d'un même joueur.
- Normalisation des titres : minuscules, trim, ponctuation et espaces superflus retirés (accents tolérés si simple).

## Structure visée (minimale, à adapter)

```
(projet Vue à la racine du dépôt, pas de dossier client/)
src/components/   composants réutilisables (liste joueurs, chrono, carte jeu…)
src/views/        Accueil, Salon, Jeu, Résultats
src/services/     firebase.js (init + helpers de lecture/écriture), rawg.js
src/assets/       main.css (import Tailwind + @theme), logo
src/App.vue, src/main.js
.env.example      VITE_FIREBASE_*, VITE_RAWG_API_KEY (sans valeurs)
database.rules.json   règles de sécurité de la Realtime Database
firebase.json         config Firebase : règles + Hosting (public: dist, rewrite vers /index.html pour /join/:code)
```

N'ajouter un fichier ou dossier que s'il a une raison concrète. Expliquer brièvement le rôle de chaque fichier important à sa création.

## Commandes

- `npm install`, `npm run dev` (dev), `npm run build` (génère `dist/`), `npm run test:unit`, `npm run lint`.
- Déploiement (une fois Firebase configuré) : `firebase deploy --only database` (règles), `firebase deploy --only hosting` (site), ou `firebase deploy` pour tout.

## Plan

1. **Décisions techniques** : architecture Vue + Firebase, étapes de config Firebase, structure des données, règles de sécurité et limites Spark. *Validation de l'utilisateur obligatoire avant tout code.*
2. **Interface Vue** : accueil, pseudo, boutons, design bleu/rose.
3. **Salons Firebase** : créer/rejoindre/quitter, pseudos, synchro des joueurs.
4. **Première manche jouable** : capture RAWG, réponse, résultat.
5. **Multijoueur et scoring** : chrono synchronisé (basé sur `endsAt`/horloge serveur Firebase), validation des réponses, points, classement.
6. **Partie complète** : plusieurs manches, fin, gagnant, rejouer.
7. **Finition** : multi-navigateurs, déconnexions, accessibilité, responsive, déploiement sur Firebase Hosting (`npm run build` puis `firebase deploy`).

L'ordre peut changer si cela accélère une version jouable.

## Première réponse attendue

Ne pas écrire de code. Présenter : l'architecture Vue + Firebase, les étapes de configuration Firebase, la structure de données avec un exemple, les règles de sécurité et limites de Spark, le plan progressif. Ne poser que les questions indispensables (notamment : auth anonyme oui/non, stratégie pour cacher la réponse), puis attendre la validation.
