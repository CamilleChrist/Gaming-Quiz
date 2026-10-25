<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getPlayerId, watchRoom, submitAnswer, revealRound } from "../services/firebase";
import RoundPlay from "../components/RoundPlay.vue";
import RoundReveal from "../components/RoundReveal.vue";

const props = defineProps({
  code: { type: String, required: true },
});

const playerId = ref("");
const meta = ref(null);
const round = ref(null);
const players = ref({});
const loading = ref(true);

const isHost = computed(() => meta.value?.hostId === playerId.value);

let unsubscribes = [];

onMounted(async () => {
  playerId.value = await getPlayerId();
  unsubscribes = [
    watchRoom(props.code, "meta", (value) => {
      meta.value = value;
      loading.value = false;
    }),
    watchRoom(props.code, "round", (value) => (round.value = value)),
    watchRoom(props.code, "players", (value) => (players.value = value ?? {})),
  ];
});

onUnmounted(() => unsubscribes.forEach((unsubscribe) => unsubscribe()));
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
      :is-host="isHost"
      @submit="(text) => submitAnswer(code, text)"
      @reveal="revealRound(code, round.index)"
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
