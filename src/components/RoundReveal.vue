<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { watchRoom } from "../services/firebase";

const props = defineProps({
  code: { type: String, required: true },
  imageUrl: { type: String, required: true },
  players: { type: Object, required: true },
  playerId: { type: String, required: true },
  nextSecondsLeft: { type: Number, required: true },
  isLastRound: { type: Boolean, default: false },
});

const title = ref("");
const points = ref({});
const answers = ref({});

// Classement provisoire : du meilleur score au moins bon
const ranking = computed(() =>
  Object.entries(props.players)
    .map(([id, player]) => ({
      id,
      name: player.name,
      score: player.score,
      answer: answers.value[id]?.text ?? "",
      points: points.value[id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score),
);

let unsubscribes = [];

// Ce composant n'existe qu'une fois la manche terminée : c'est le bon moment pour lire les réponses,
// que les règles cachent pendant la manche.
onMounted(() => {
  unsubscribes = [
    watchRoom(props.code, "reveal", (value) => {
      title.value = value?.title ?? "";
      points.value = value?.points ?? {};
    }),
    watchRoom(props.code, "answers", (value) => (answers.value = value ?? {})),
  ];
});

onUnmounted(() => unsubscribes.forEach((unsubscribe) => unsubscribe()));
</script>

<template>
  <section class="flex flex-col gap-6">
    <img
      :src="imageUrl"
      alt="Capture d'écran du jeu"
      class="aspect-video w-full rounded-3xl bg-card object-cover"
    />

    <header class="text-center" aria-live="polite">
      <p class="text-muted">C'était</p>
      <h2 class="text-3xl font-black text-pink">{{ title }}</h2>
    </header>

    <ol class="flex flex-col gap-2 rounded-3xl bg-card p-6">
      <li
        v-for="(player, position) in ranking"
        :key="player.id"
        class="flex items-center gap-4 rounded-xl bg-night px-4 py-3"
      >
        <span class="font-black text-muted">{{ position + 1 }}</span>
        <span class="min-w-0 flex-1">
          <span class="font-semibold">{{ player.name }}</span>
          <span v-if="player.id === playerId" class="text-muted"> (toi)</span>
          <span class="block truncate text-sm text-muted">
            {{ player.answer || "Pas de réponse" }}
          </span>
        </span>
        <span
          class="shrink-0 rounded-full px-3 py-1 text-sm font-bold"
          :class="player.points > 0 ? 'bg-electric' : 'bg-card text-muted'"
        >
          {{ player.points > 0 ? `+${player.points}` : "Raté" }}
        </span>
        <span class="w-12 shrink-0 text-right font-black tabular-nums">{{ player.score }}</span>
      </li>
    </ol>

    <p class="text-center text-muted">
      {{ isLastRound ? "Résultats" : "Manche suivante" }} dans {{ nextSecondsLeft }} s
    </p>
  </section>
</template>
