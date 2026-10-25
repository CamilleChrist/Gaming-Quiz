<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { getPlayerId, watchRoom, submitAnswer, revealRound, serverNow } from "../services/firebase";
import RoundPlay from "../components/RoundPlay.vue";
import RoundReveal from "../components/RoundReveal.vue";

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

// La manche est finie quand le chrono tombe à 0, ou quand tout le monde a répondu (ou passé).
const roundOver = computed(() => {
  if (!round.value || playerList.value.length === 0) return false;
  return secondsLeft.value === 0 || playerList.value.every((player) => player.answered);
});

// watch() lance une fonction à chaque changement de valeur : ici, quand roundOver passe à true.
// Seul l'hôte révèle la réponse et compte les points, une seule fois par manche.
watch(roundOver, (over) => {
  if (over && isHost.value && meta.value.status === "playing") {
    revealRound(props.code, round.value, meta.value.secondsPerRound);
  }
});

let unsubscribes = [];
let timer;

onMounted(async () => {
  playerId.value = await getPlayerId();
  unsubscribes = [
    watchRoom(props.code, "meta", (value) => {
      meta.value = value;
      loading.value = false;
    }),
    watchRoom(props.code, "round", (value) => (round.value = value)),
    watchRoom(props.code, "players", (value) => (players.value = value ?? {})),
    watchRoom(props.code, "answered", (value) => (answered.value = value ?? {})),
  ];
  // Le chrono se recalcule 4 fois par seconde à partir de l'heure de fin écrite par l'hôte.
  timer = setInterval(() => (now.value = serverNow()), 250);
});

onUnmounted(() => {
  unsubscribes.forEach((unsubscribe) => unsubscribe());
  clearInterval(timer);
});
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-10">
    <p v-if="loading || (meta && !round)" class="text-center text-muted">Chargement de la partie…</p>

    <section v-else-if="!meta" class="flex flex-col gap-4 text-center">
      <p>Cette partie n'existe plus.</p>
      <RouterLink to="/" class="font-bold text-pink underline">Retour à l'accueil</RouterLink>
    </section>

    <!-- Le statut écrit par l'hôte décide de l'écran affiché chez tout le monde -->
    <RoundPlay
      v-else-if="meta.status === 'playing'"
      :key="round.index"
      :image-url="round.imageUrl"
      :round-number="round.index + 1"
      :rounds="meta.rounds"
      :seconds-left="secondsLeft"
      :players="playerList"
      @submit="(text) => submitAnswer(code, text)"
    />

    <RoundReveal
      v-else-if="meta.status === 'reveal'"
      :code="code"
      :image-url="round.imageUrl"
      :players="players"
      :player-id="playerId"
    />
  </main>
</template>
