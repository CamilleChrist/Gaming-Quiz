<script setup>
import { computed } from "vue";

const props = defineProps({
  players: { type: Object, required: true },
  playerId: { type: String, required: true },
  isHost: { type: Boolean, default: false },
});

const emit = defineEmits(["replay", "leave"]);

const ranking = computed(() =>
  Object.entries(props.players)
    .map(([id, player]) => ({ id, name: player.name, score: player.score }))
    .sort((a, b) => b.score - a.score),
);

// Plusieurs gagnants en cas d'égalité au meilleur score
const winners = computed(() => ranking.value.filter((player) => player.score === ranking.value[0]?.score));
</script>

<template>
  <section class="flex flex-col gap-8">
    <header class="text-center" aria-live="polite">
      <p class="text-muted">Partie terminée</p>
      <h1
        class="bg-linear-to-r from-electric to-pink bg-clip-text text-4xl font-black text-transparent"
      >
        <template v-if="winners.length === 1">{{ winners[0].name }} gagne !</template>
        <template v-else>Égalité entre {{ winners.map((player) => player.name).join(" et ") }} !</template>
      </h1>
    </header>

    <ol class="flex flex-col gap-2 rounded-3xl bg-card p-6">
      <li
        v-for="(player, position) in ranking"
        :key="player.id"
        class="flex items-center gap-4 rounded-xl bg-night px-4 py-3"
      >
        <span class="font-black text-muted">{{ position + 1 }}</span>
        <span class="min-w-0 flex-1 truncate font-semibold">
          {{ player.name }}
          <span v-if="player.id === playerId" class="font-normal text-muted">(toi)</span>
        </span>
        <span class="font-black tabular-nums">{{ player.score }}</span>
      </li>
    </ol>

    <div class="flex flex-col gap-3">
      <button
        v-if="isHost"
        type="button"
        class="rounded-full bg-electric px-6 py-3 font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        @click="emit('replay')"
      >
        Rejouer
      </button>
      <p v-else class="text-center text-muted">L'hôte peut relancer une partie.</p>

      <button
        type="button"
        class="rounded-full border-2 border-muted px-6 py-3 font-bold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        @click="emit('leave')"
      >
        Retour à l'accueil
      </button>
    </div>
  </section>
</template>
