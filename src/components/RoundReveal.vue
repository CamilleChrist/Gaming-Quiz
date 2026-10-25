<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { watchRoom } from "../services/firebase";

const props = defineProps({
  code: { type: String, required: true },
  imageUrl: { type: String, required: true },
  // Classement provisoire [{ id, name, score }], déjà trié par RoomView
  ranking: { type: Array, required: true },
  playerId: { type: String, required: true },
  nextSecondsLeft: { type: Number, required: true },
  isLastRound: { type: Boolean, default: false },
});

const title = ref("");
const points = ref({});
const answers = ref({});

// On ajoute à chaque joueur sa réponse et ses points de la manche
const results = computed(() =>
  props.ranking.map((player) => ({
    ...player,
    answer: answers.value[player.id]?.text ?? "",
    points: points.value[player.id] ?? 0,
  })),
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
  <!-- Mobile : une colonne. Bureau : image et titre à gauche, classement à droite -->
  <section class="mx-auto grid w-full max-w-md grid-cols-1 gap-6 lg:max-w-5xl lg:grid-cols-2 lg:items-center lg:gap-12">
    <div class="flex flex-col gap-6">
      <div class="rounded-2xl bg-ink p-2 shadow-block shadow-pink">
        <img
          :src="imageUrl"
          alt="Capture d'écran du jeu"
          class="aspect-video w-full rounded-xl bg-card object-cover"
        />
      </div>

      <header class="flex flex-col items-start gap-2" aria-live="polite">
        <p class="text-sm font-bold tracking-widest text-muted uppercase">C'était</p>
        <!-- v-if : la pastille n'apparaît (et ne s'anime) qu'une fois le titre reçu de Firebase -->
        <h2
          v-if="title"
          class="-rotate-2 rounded-xl bg-pink px-4 pt-2.5 pb-2 font-display text-3xl leading-tight text-night shadow-block-sm shadow-violet motion-safe:animate-slap"
        >
          {{ title }}
        </h2>
      </header>
    </div>

    <div class="flex flex-col gap-5">
      <ol class="flex flex-col rounded-2xl bg-ink px-4 py-1.5 text-night shadow-block shadow-electric">
        <li
          v-for="player in results"
          :key="player.id"
          class="flex items-center gap-3 border-b-2 border-dashed border-night/15 py-3 last:border-b-0"
        >
          <span class="w-5 font-display text-xl">{{ player.rank }}</span>
          <span class="min-w-0 flex-1">
            <span class="font-bold">{{ player.name }}</span>
            <span v-if="player.id === playerId" class="font-medium"> (toi)</span>
            <span class="block truncate text-sm text-night/70">
              {{ player.answer || "Pas de réponse" }}
            </span>
          </span>
          <!-- Points affichés seulement une fois la révélation reçue : sinon tout le monde voit « Raté » un instant -->
          <template v-if="title">
            <span
              v-if="player.points > 0"
              class="shrink-0 rounded-md bg-electric px-2 py-1 font-display text-sm text-ink motion-safe:animate-stamp"
            >
              +{{ player.points }}
            </span>
            <span v-else class="shrink-0 rounded-md border-2 border-night px-2 py-0.5 text-sm font-bold">
              Raté
            </span>
          </template>
          <span class="w-12 shrink-0 text-right font-display text-lg tabular-nums">{{ player.score }}</span>
        </li>
      </ol>

      <p
        class="flex items-center justify-between rounded-xl border-2 border-muted/50 px-4 py-3 font-semibold text-muted"
      >
        {{ isLastRound ? "Résultats" : "Manche suivante" }} dans
        <span class="font-display text-2xl text-ink">{{ nextSecondsLeft }}<span class="font-sans text-lg font-bold"> s</span></span>
      </p>
    </div>
  </section>
</template>
