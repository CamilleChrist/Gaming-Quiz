// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, browserSessionPersistence, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp } from "firebase/database";
import { scoreRound } from "./rawg";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: browserSessionPersistence });
const db = getDatabase(app);

// Écart entre l'horloge de ce PC et celle du serveur Firebase, tenu à jour par Firebase.
// Il permet à tous les joueurs d'afficher le même chrono, même si leur PC n'est pas à l'heure.
let serverTimeOffset = 0;
onValue(ref(db, ".info/serverTimeOffset"), (snapshot) => (serverTimeOffset = snapshot.val()));

export function serverNow() {
  return Date.now() + serverTimeOffset;
}

export async function getPlayerId() {
  const { user } = await signInAnonymously(auth);
  return user.uid;
}

export async function createRoom(name) {
  const uid = await getPlayerId();
  const room = {
    meta: {
      hostId: uid,
      status: "lobby",
      rounds: 10,
      secondsPerRound: 30,
    },
    players: {
      [uid]: {
        name: name.trim(),
        score: 0,
        joinedAt: serverTimestamp(),
      },
    },
  };

  const code = crypto.randomUUID().slice(0, 6).toUpperCase(); // 6 caractères hexadécimaux aléatoires (0-9, A-F) : ~16 millions de codes.
  const roomRef = ref(db, `rooms/${code}`);

  await set(roomRef, room); // Si le code est déjà pris (quasi impossible), les règles refusent d'écraser le salon : l'erreur remonte et le joueur n'a qu'à recliquer.
  await onDisconnect(roomRef).remove(); // Si l'hôte ferme l'onglet, Firebase supprime le salon côté serveur.

  return code;
}

export async function joinRoom(code, name) {
  const uid = await getPlayerId();
  const playerRef = ref(db, `rooms/${code}/players/${uid}`);

  // Les règles RTDB ne savent pas compter les joueurs : la limite de 6 est vérifiée ici.
  // Ce n'est pas infaillible : un tricheur peut passer outre, et si deux joueurs arrivent pile en même temps, on peut se retrouver à 7. Acceptable ici.
  const players = await get(ref(db, `rooms/${code}/players`));
  if (players.size >= 6) throw new Error("Salon complet");

  await set(playerRef, { name: name.trim(), score: 0, joinedAt: serverTimestamp() }); // Refusé par les règles si le salon n'existe pas ou a déjà commencé.
  await onDisconnect(playerRef).remove(); // Si le joueur ferme l'onglet, il quitte le salon.

  return code;
}

// Seul l'hôte remplit ce tableau : les titres restent dans la mémoire de son onglet, jamais dans la base, pour que personne ne puisse lire la réponse pendant la manche.
let hostQuestions = [];

const REVEAL_SECONDS = 6; // Durée d'affichage de la réponse avant la manche suivante.

// update() écrit plusieurs chemins d'un coup : les joueurs reçoivent la manche et le statut ensemble.
// Les réponses de la manche précédente sont effacées (null = suppression).
function startRound(code, index, secondsPerRound) {
  return update(ref(db, `rooms/${code}`), {
    round: {
      index,
      imageUrl: hostQuestions[index].imageUrl,
      endsAt: serverNow() + secondsPerRound * 1000,
    },
    answers: null,
    answered: null,
    reveal: null,
    "meta/status": "playing",
  });
}

export async function startGame(code, questions, secondsPerRound) {
  hostQuestions = questions;
  await startRound(code, 0, secondsPerRound);
}

// Après la révélation : manche suivante, ou fin de partie s'il n'y a plus de question.
export async function nextRound(code, round, secondsPerRound) {
  const index = round.index + 1;
  if (index < hostQuestions.length) {
    await startRound(code, index, secondsPerRound);
  } else {
    await update(ref(db, `rooms/${code}/meta`), { status: "finished" });
  }
}

// « Rejouer » : retour au salon avec les mêmes joueurs, scores remis à zéro.
export async function resetGame(code, playerIds) {
  const updates = { round: null, answers: null, answered: null, reveal: null, "meta/status": "lobby" };
  playerIds.forEach((uid) => (updates[`players/${uid}/score`] = 0));
  await update(ref(db, `rooms/${code}`), updates);
}

// Réglages du salon choisis par l'hôte, par exemple { rounds: 5 } ou { secondsPerRound: 45 }.
export async function updateSettings(code, settings) {
  await update(ref(db, `rooms/${code}/meta`), settings);
}

export async function submitAnswer(code, text) {
  const uid = await getPlayerId();
  // La réponse reste cachée jusqu'à la révélation ; « answered » est visible de tous pour savoir qui a répondu.
  // Une seule réponse par joueur, avant la fin du chrono : les règles refusent les autres.
  await update(ref(db, `rooms/${code}`), {
    [`answers/${uid}`]: { text: text.trim(), submittedAt: serverTimestamp() },
    [`answered/${uid}`]: true,
  });
}

// L'hôte calcule les points de la manche, puis révèle le titre et les scores en une seule écriture.
export async function revealRound(code, round) {
  const title = hostQuestions[round.index].title;
  const answers = await get(ref(db, `rooms/${code}/answers`));
  const players = await get(ref(db, `rooms/${code}/players`));

  const list = [];
  answers.forEach((answer) => {
    if (players.hasChild(answer.key)) list.push({ uid: answer.key, ...answer.val() }); // Ignore les joueurs partis en cours de manche.
  });
  const points = scoreRound(list, title);

  const updates = {};
  Object.entries(points).forEach(([uid, value]) => {
    updates[`players/${uid}/score`] = players.child(`${uid}/score`).val() + value;
  });

  await update(ref(db, `rooms/${code}`), {
    ...updates,
    reveal: { title, points },
    "round/nextAt": serverNow() + REVEAL_SECONDS * 1000,
    "meta/status": "reveal",
  });
}

export async function leaveRoom(code, isHost) {
  const uid = await getPlayerId();
  // L'hôte qui part ferme le salon pour tout le monde.
  await remove(ref(db, isHost ? `rooms/${code}` : `rooms/${code}/players/${uid}`));
}

// Abonnement temps réel à une partie du salon ("meta", "players"…).
// On lit nœud par nœud : les règles n'autorisent pas la lecture du salon entier, pour pouvoir cacher les réponses ("answers") plus tard.
// Retourne la fonction de désabonnement, à appeler dans onUnmounted.
export function watchRoom(code, node, callback) {
  return onValue(ref(db, `rooms/${code}/${node}`), (snapshot) =>
    callback(snapshot.val()),
  );
}