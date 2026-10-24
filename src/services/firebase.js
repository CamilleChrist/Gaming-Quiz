// Seul fichier qui importe `firebase/*` : les composants passent par les fonctions exportées ici.
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserSessionPersistence,
  signInAnonymously,
} from "firebase/auth";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// Session par onglet : deux onglets du même navigateur = deux joueurs distincts
// (pratique pour tester le multijoueur), et le joueur reste le même s'il recharge la page.
const auth = initializeAuth(app, { persistence: browserSessionPersistence });

// Connexion anonyme : aucun compte visible, mais un uid que les règles de sécurité
// peuvent vérifier. Cet uid sert d'identifiant de joueur (distinct du code du salon).
// Si l'onglet est déjà connecté, Firebase renvoie le même utilisateur.
export async function getPlayerId() {
  const { user } = await signInAnonymously(auth);
  return user.uid;
}
