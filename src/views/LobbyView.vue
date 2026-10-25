<script setup>
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { getPlayerId, watchRoom, leaveRoom, startGame, updateSettings } from "../services/firebase";
import { fetchQuestions } from "../services/rawg";

const props = defineProps({
  code: { type: String, required: true },
});

const playerId = ref("");
const meta = ref(null);
const players = ref({});
const loading = ref(true);
const copyMessage = ref("");
const inviteInput = useTemplateRef("invite-input"); // L'élément <input ref="invite-input"> du template
const starting = ref(false);
const startError = ref("");
const router = useRouter();

const inviteLink = computed(() => `${location.origin}/join/${props.code}`);
const isHost = computed(() => meta.value?.hostId === playerId.value);
// Firebase renvoie un objet { uid: joueur } : on le transforme en liste triée par arrivée
const playerList = computed(() =>
  Object.entries(players.value)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => a.joinedAt - b.joinedAt),
);

let unsubscribes = [];

onMounted(async () => {
  // On attend la connexion anonyme : les règles refusent la lecture sans elle
  playerId.value = await getPlayerId();
  unsubscribes = [
    watchRoom(props.code, "meta", (value) => {
      meta.value = value;
      loading.value = false;
      // Quand l'hôte lance la partie, tous les joueurs passent à l'écran de jeu
      if (value?.status === "playing") router.push(`/room/${props.code}/play`);
    }),
    watchRoom(props.code, "players", (value) => {
      players.value = value ?? {};
      // Arrivé ici sans avoir rejoint (lien /room/… collé, page actualisée) : on passe par l'écran pour rejoindre.
      if (value && !(playerId.value in value)) router.replace(`/join/${props.code}`);
    }),
  ];
  window.addEventListener("beforeunload", warnHostBeforeLeaving);
});

onUnmounted(() => {
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  window.removeEventListener("beforeunload", warnHostBeforeLeaving);
});

// Si l'hôte ferme ou actualise la page, le salon est supprimé pour tout le monde :
// le navigateur lui demande d'abord confirmation.
function warnHostBeforeLeaving(event) {
  if (isHost.value) event.preventDefault();
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copyMessage.value = "Lien copié !";
  } catch {
    // Presse-papiers indisponible (site ouvert en http sur un téléphone, permission refusée…) :
    // on sélectionne le lien pour que le joueur le copie lui-même.
    inviteInput.value.select();
    copyMessage.value = "Copie automatique impossible : le lien est sélectionné, copie-le à la main.";
  }
}

async function start() {
  starting.value = true;
  startError.value = "";
  try {
    const questions = await fetchQuestions(meta.value.rounds);
    await startGame(props.code, questions, meta.value.secondsPerRound);
  } catch (error) {
    console.error(error);
    startError.value = "Impossible de lancer la partie, réessaie.";
    starting.value = false;
  }
}

async function leave() {
  await leaveRoom(props.code, isHost.value);
  router.push("/");
}

const ROUND_CHOICES = [5, 10, 15];
const SECONDS_CHOICES = [15, 30, 45];

// La valeur affichée vient de Firebase (:value) ; on n'écrit dans Firebase que quand l'hôte la change.
// Tous les joueurs voient alors le nouveau réglage en temps réel.
function changeSetting(name, event) {
  updateSettings(props.code, { [name]: Number(event.target.value) });
}
</script>

<template>
  <main
    class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10"
  >
    <p v-if="loading" class="text-center text-muted">Chargement du salon…</p>

    <section v-else-if="!meta" class="flex flex-col gap-4 text-center">
      <p>Ce salon n'existe plus : l'hôte l'a fermé ou a quitté la partie.</p>
      <RouterLink to="/" class="font-bold text-pink underline">
        Retour à l'accueil
      </RouterLink>
    </section>

    <template v-else>
      <header class="text-center">
        <p class="text-muted">Code du salon</p>
        <h1 class="text-5xl font-black tracking-widest text-electric">
          {{ code }}
        </h1>
      </header>

      <section class="flex flex-col gap-2 rounded-3xl bg-card p-6">
        <label for="invite-link" class="font-semibold">Lien d'invitation</label>
        <div class="flex gap-2">
          <input
            id="invite-link"
            ref="invite-input"
            :value="inviteLink"
            readonly
            class="min-w-0 flex-1 rounded-xl bg-night px-4 py-3 text-muted focus:outline-2 focus:outline-electric"
          />
          <button
            type="button"
            class="rounded-full bg-pink px-5 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
            @click="copyLink"
          >
            Copier
          </button>
        </div>
        <p aria-live="polite" class="text-sm text-pink">{{ copyMessage }}</p>
      </section>

      <section class="flex flex-col gap-4 rounded-3xl bg-card p-6">
        <h2 class="font-semibold">Joueurs {{ playerList.length }}/6</h2>
        <!-- aria-live : les lecteurs d'écran annoncent les arrivées et départs -->
        <ul class="flex flex-col gap-2" aria-live="polite">
          <li
            v-for="player in playerList"
            :key="player.id"
            class="flex items-center justify-between rounded-xl bg-night px-4 py-3"
          >
            <span>
              {{ player.name }}
              <span v-if="player.id === playerId" class="text-muted">(toi)</span>
            </span>
            <span
              v-if="player.id === meta.hostId"
              class="rounded-full bg-violet px-3 py-1 text-sm font-bold"
            >
              Hôte
            </span>
          </li>
        </ul>
      </section>

      <!-- Seul l'hôte peut modifier les réglages ; les autres les voient sans pouvoir y toucher -->
      <section class="grid grid-cols-2 gap-4 rounded-3xl bg-card p-6">
        <div class="flex flex-col gap-2">
          <label for="rounds" class="font-semibold">Manches</label>
          <select
            id="rounds"
            :value="meta.rounds"
            :disabled="!isHost"
            class="rounded-xl bg-night px-4 py-3 focus:outline-2 focus:outline-electric disabled:opacity-60"
            @change="changeSetting('rounds', $event)"
          >
            <option v-for="choice in ROUND_CHOICES" :key="choice" :value="choice">
              {{ choice }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label for="seconds" class="font-semibold">Temps par manche</label>
          <select
            id="seconds"
            :value="meta.secondsPerRound"
            :disabled="!isHost"
            class="rounded-xl bg-night px-4 py-3 focus:outline-2 focus:outline-electric disabled:opacity-60"
            @change="changeSetting('secondsPerRound', $event)"
          >
            <option v-for="choice in SECONDS_CHOICES" :key="choice" :value="choice">
              {{ choice }} s
            </option>
          </select>
        </div>
      </section>

      <button
        v-if="isHost"
        type="button"
        :disabled="starting"
        class="rounded-full bg-electric px-6 py-3 font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:cursor-not-allowed disabled:opacity-40"
        @click="start"
      >
        {{ starting ? "Préparation des questions…" : "Lancer la partie" }}
      </button>
      <p v-else class="text-center text-muted">
        En attente du lancement par l'hôte…
      </p>
      <p v-if="startError" role="alert" class="text-center text-sm text-pink">
        {{ startError }}
      </p>

      <button
        type="button"
        class="rounded-full border-2 border-muted px-6 py-3 font-bold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        @click="leave"
      >
        Quitter le salon
      </button>
    </template>
  </main>
</template>
