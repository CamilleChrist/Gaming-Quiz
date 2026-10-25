<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { watchRoom } from "../services/firebase";
import { isCorrectAnswer } from "../services/rawg";

const props = defineProps({
  code: { type: String, required: true },
  imageUrl: { type: String, required: true },
  players: { type: Object, required: true },
  playerId: { type: String, required: true },
});

const title = ref("");
const answers = ref({});

const results = computed(() =>
  Object.entries(props.players).map(([id, player]) => {
    const answer = answers.value[id] ?? "";
    return { id, name: player.name, answer, correct: isCorrectAnswer(answer, title.value) };
  }),
);

let unsubscribes = [];

// Ce composant n'existe qu'une fois la manche terminée : c'est le bon moment pour lire les réponses,
// que les règles cachent pendant la manche.
onMounted(() => {
  unsubscribes = [
    watchRoom(props.code, "reveal", (value) => (title.value = value?.title ?? "")),
    watchRoom(props.code, "answers", (value) => (answers.value = value ?? {})),
  ];
});

onUnmounted(() => unsubscribes.forEach((unsubscribe) => unsubscribe()));
</script>

<template>
  <section class="flex flex-col gap-6" aria-live="polite">
    <img
      :src="imageUrl"
      alt="Capture d'écran du jeu"
      class="aspect-video w-full rounded-3xl bg-card object-cover"
    />

    <header class="text-center">
      <p class="text-muted">C'était</p>
      <h2 class="text-3xl font-black text-pink">{{ title }}</h2>
    </header>

    <ul class="flex flex-col gap-2 rounded-3xl bg-card p-6">
      <li
        v-for="result in results"
        :key="result.id"
        class="flex items-center justify-between gap-4 rounded-xl bg-night px-4 py-3"
      >
        <span class="min-w-0">
          <span class="font-semibold">{{ result.name }}</span>
          <span v-if="result.id === playerId" class="text-muted"> (toi)</span>
          <span class="block truncate text-sm text-muted">
            {{ result.answer || "Pas de réponse" }}
          </span>
        </span>
        <span
          class="shrink-0 rounded-full px-3 py-1 text-sm font-bold"
          :class="result.correct ? 'bg-electric' : 'bg-card text-muted'"
        >
          {{ result.correct ? "Trouvé !" : "Raté" }}
        </span>
      </li>
    </ul>
  </section>
</template>
