---

paths:

  - 'src/services/**'
  - 'database.rules.json'
  - 'firebase.json'

---

# Firebase

Firebase Realtime Database is the only backend. Stay on the free Spark plan.

## Scope

* Use only the Realtime Database and Hosting. Ask the user before enabling any other Firebase service (Auth, Functions, Firestore, etc.).
* Warn the user before any change that could incur costs. Never enable a paid plan.
* Keep all Firebase code in `src/services/firebase.js`. Components never import `firebase/*` directly.

## Data

* Game data is temporary: never keep scores or history after a room is closed.
* Delete `rooms/{code}` when the game ends. Clean up abandoned rooms with `onDisconnect()` and a `createdAt` timestamp.
* The room code must be hard to guess and distinct from the internal player id.
* A room holds at most 6 players.

## Trust and security

* The host client acts as referee, so client-sent scores are never fully trustworthy. Say so when relevant.
* Never write the correct title where other players can read it before the round ends.
* Do not reveal other players' answers before the end of the round.
* Write validation rules in `database.rules.json`: types, string lengths, player limit, and writes only allowed in the matching game status.
* Subscribe with `onValue` and always call the returned unsubscribe function in `onUnmounted`.

## Configuration

* Firebase settings come from `VITE_FIREBASE_*` variables in `.env.local`. Never commit them or hard-code them.
* Keep `.env.example` up to date with the variable names, without values.
