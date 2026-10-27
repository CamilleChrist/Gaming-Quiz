<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  getPlayerId,
  watchRoom,
  submitAnswer,
  revealRound,
  nextRound,
  resetGame,
  leaveRoom,
  serverNow,
} from "../services/firebase";
import LobbyPanel from "../components/LobbyPanel.vue";
import RoundPlay from "../components/RoundPlay.vue";
import RoundReveal from "../components/RoundReveal.vue";
import GameResults from "../components/GameResults.vue";

const props = defineProps({
  code: { type: String, required: true },
});

const playerId = ref("");
const meta = ref(null);
const round = ref(null);
const players = ref({});
const answered = ref({});
const loading = ref(true);
const now = ref(serverNow());
const answerError = ref("");

const isHost = computed(() => meta.value?.hostId === playerId.value);
const secondsLeft = computed(() =>
  round.value ? Math.max(0, Math.ceil((round.value.endsAt - now.value) / 1000)) : 0,
);
const playerList = computed(() =>
  Object.entries(players.value).map(([id, player]) => ({
    id,
    name: player.name,
    answered: id in answered.value,
  })),
);
// Classement, du meilleur score au moins bon : partagé par la révélation et les résultats.
// Rang avec égalités : deux premiers ex æquo sont 1 et 1, le suivant est 3
// (le rang est la position du premier joueur qui a le même score).
const ranking = computed(() => {
  const sorted = Object.entries(players.value)
    .map(([id, player]) => ({ id, name: player.name, score: player.score }))
    .sort((a, b) => b.score - a.score);
  return sorted.map((player) => ({
    ...player,
    rank: sorted.findIndex((other) => other.score === player.score) + 1,
  }));
});

// La manche est finie quand le chrono tombe à 0, ou quand tout le monde a répondu (ou passé).
const roundOver = computed(() => {
  if (!round.value || playerList.value.length === 0) return false;
  return secondsLeft.value === 0 || playerList.value.every((player) => player.answered);
});

// watch() lance une fonction à chaque changement de valeur : ici, quand roundOver passe à true.
// Seul l'hôte révèle la réponse et compte les points, une seule fois par manche.
watch(roundOver, (over) => {
  if (over && isHost.value && meta.value.status === "playing") {
    revealRound(props.code, round.value);
  }
});

// Après la révélation, l'hôte enchaîne tout seul sur la manche suivante (ou les résultats) à l'heure « nextAt ».
const nextSecondsLeft = computed(() =>
  round.value?.nextAt ? Math.max(0, Math.ceil((round.value.nextAt - now.value) / 1000)) : 0,
);
const revealOver = computed(
  () => meta.value?.status === "reveal" && Boolean(round.value?.nextAt) && nextSecondsLeft.value === 0,
);

watch(revealOver, (over) => {
  if (over && isHost.value) {
    nextRound(props.code, round.value, meta.value.secondsPerRound);
  }
});

const router = useRouter();

async function sendAnswer(text) {
  try {
    await submitAnswer(props.code, text);
  } catch (error) {
    // Le plus souvent : réponse arrivée après la fin du chrono, refusée par les règles.
    console.error(error);
    answerError.value = "Ta réponse n'a pas pu être envoyée (temps écoulé ou connexion perdue).";
  }
}

function replay() {
  resetGame(props.code, Object.keys(players.value));
}

async function leave() {
  await leaveRoom(props.code, isHost.value);
  router.push("/");
}

let unsubscribes = [];
let timer;

onMounted(async () => {
  playerId.value = await getPlayerId();
  unsubscribes = [
    watchRoom(props.code, "meta", (value) => {
      meta.value = value;
      loading.value = false;
    }),
    watchRoom(props.code, "round", (value) => {
      round.value = value;
      answerError.value = ""; // Nouvelle manche : on oublie l'erreur de la précédente.
    }),
    watchRoom(props.code, "players", (value) => {
      players.value = value ?? {};
      // Arrivé ici sans avoir rejoint (lien /room/… collé, page actualisée) : on passe par l'écran pour rejoindre.
      if (value && !(playerId.value in value)) router.replace(`/join/${props.code}`);
    }),
    watchRoom(props.code, "answered", (value) => (answered.value = value ?? {})),
  ];
  // Le chrono se recalcule 4 fois par seconde à partir de l'heure de fin écrite par l'hôte.
  timer = setInterval(() => (now.value = serverNow()), 250);
  window.addEventListener("beforeunload", warnHostBeforeLeaving);
});

onUnmounted(() => {
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  clearInterval(timer);
  window.removeEventListener("beforeunload", warnHostBeforeLeaving);
});

// Si l'hôte ferme ou actualise la page, le salon est supprimé pour tout le monde :
// le navigateur lui demande d'abord confirmation.
function warnHostBeforeLeaving(event) {
  if (isHost.value) event.preventDefault();
}
</script>

<template>
  <!-- Chaque écran règle sa propre largeur : ici, seulement la place maximale -->
  <main class="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-8 px-6 py-10">
    <p v-if="loading" class="text-center font-display text-xl text-muted motion-safe:animate-pulse">
      Chargement du salon…
    </p>

    <section
      v-else-if="!meta"
      class="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl bg-ink p-6 text-night shadow-block shadow-pink"
    >
      <p class="text-xl font-bold">Ce salon n'existe plus : l'hôte l'a fermé ou a quitté la partie.</p>
      <RouterLink
        to="/"
        class="grid h-14 place-items-center rounded-xl border-2 border-night bg-pink font-display text-lg shadow-key-sm shadow-night transition hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-electric active:translate-y-1 active:shadow-none"
      >
        Retour à l'accueil
      </RouterLink>
    </section>

    <!-- Le statut écrit par l'hôte décide de l'écran affiché chez tout le monde -->
    <LobbyPanel
      v-else-if="meta.status === 'lobby'"
      :code="code"
      :meta="meta"
      :players="players"
      :player-id="playerId"
      :is-host="isHost"
      @leave="leave"
    />

    <p v-else-if="!round" class="text-center font-display text-xl text-muted motion-safe:animate-pulse">
      Chargement de la partie…
    </p>

    <RoundPlay
      v-else-if="meta.status === 'playing'"
      :key="round.index"
      :image-url="round.imageUrl"
      :round-number="round.index + 1"
      :rounds="meta.rounds"
      :seconds-left="secondsLeft"
      :seconds-per-round="meta.secondsPerRound"
      :players="playerList"
      :error="answerError"
      @submit="sendAnswer"
    />

    <RoundReveal
      v-else-if="meta.status === 'reveal'"
      :code="code"
      :image-url="round.imageUrl"
      :ranking="ranking"
      :player-id="playerId"
      :next-seconds-left="nextSecondsLeft"
      :is-last-round="round.index + 1 >= meta.rounds"
    />

    <GameResults
      v-else-if="meta.status === 'finished'"
      :ranking="ranking"
      :player-id="playerId"
      :is-host="isHost"
      @replay="replay"
      @leave="leave"
    />
  </main>
</template>
