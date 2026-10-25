<script setup>
import { computed } from "vue";
import AppButton from "./AppButton.vue";

const props = defineProps({
  // Classement final [{ id, name, score, rank }], déjà trié par RoomView
  ranking: { type: Array, required: true },
  playerId: { type: String, required: true },
  isHost: { type: Boolean, default: false },
});

const emit = defineEmits(["replay", "leave"]);

// Plusieurs gagnants en cas d'égalité au meilleur score
const winners = computed(() => props.ranking.filter((player) => player.rank === 1));

// Les 3 premiers montent sur le podium, les autres sont listés en dessous
const podium = computed(() => props.ranking.slice(0, 3));
const others = computed(() => props.ranking.slice(3));

// Hauteur et couleur de la marche selon le rang
const STEP_CLASSES = {
  1: "h-38 bg-pink text-night text-5xl",
  2: "h-28 bg-electric text-4xl",
  3: "h-19 bg-violet text-4xl",
};

// Colonne de chaque joueur du podium : disposition classique 2e - 1er - 3e (le 1er au centre, même seul),
// sauf égalité en tête : on garde alors l'ordre du classement, de gauche à droite
function podiumColumn(index) {
  if (winners.value.length > 1) return ["col-start-1", "col-start-2", "col-start-3"][index];
  return ["col-start-2", "col-start-1", "col-start-3"][index];
}
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-7">
    <header class="flex flex-col gap-2.5" aria-live="polite">
      <p class="text-sm font-bold tracking-widest text-muted uppercase">Partie terminée</p>
      <h1 v-if="winners.length === 1" class="font-display text-4xl leading-tight">
        <!-- &nbsp; : espace insécable, le « ! » ne part jamais seul à la ligne -->
        {{ winners[0].name }} <span class="text-pink">gagne&nbsp;!</span>
      </h1>
      <h1 v-else class="font-display text-3xl leading-tight">
        <span class="text-pink">Égalité</span> entre
        {{ winners.map((player) => player.name).join(" et ") }}&nbsp;!
      </h1>
    </header>

    <div>
      <!-- Toujours 3 colonnes ; row-start-1 garde tout le monde sur la même ligne -->
      <ol class="grid min-h-64 grid-cols-3 items-end gap-2.5">
        <li
          v-for="(player, index) in podium"
          :key="player.id"
          class="row-start-1 flex min-w-0 flex-col gap-2 text-center"
          :class="podiumColumn(index)"
        >
          <svg
            v-if="player.rank === 1"
            class="size-8 self-center fill-pink stroke-ink"
            viewBox="0 0 24 24"
            stroke-width="1.6"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
          </svg>
          <span class="truncate font-bold">
            {{ player.name }}
            <span v-if="player.id === playerId" class="font-medium text-muted">(toi)</span>
          </span>
          <span class="font-display text-lg">{{ player.score }}</span>
          <span
            class="flex origin-bottom justify-center rounded-t-xl rounded-b-sm pt-3 font-display leading-none motion-safe:animate-grow"
            :class="STEP_CLASSES[player.rank]"
          >
            {{ player.rank }}
          </span>
        </li>
      </ol>

      <!-- Les joueurs suivants, posés comme un sol sous le podium -->
      <ol
        v-if="others.length"
        class="flex flex-col rounded-t-sm rounded-b-2xl bg-ink px-4 py-1 text-night"
      >
        <li
          v-for="player in others"
          :key="player.id"
          class="flex h-12 items-center gap-3.5 border-b-2 border-dashed border-night/15 last:border-b-0"
        >
          <span class="w-5 font-display text-lg">{{ player.rank }}</span>
          <span class="min-w-0 flex-1 truncate font-bold">
            {{ player.name }}
            <span v-if="player.id === playerId" class="font-medium">(toi)</span>
          </span>
          <span class="font-display">{{ player.score }}</span>
        </li>
      </ol>
    </div>

    <div class="flex flex-col gap-3">
      <AppButton v-if="isHost" class="h-15" @click="emit('replay')">Rejouer</AppButton>
      <p v-else class="text-center text-muted">L'hôte peut relancer une partie.</p>

      <AppButton variant="ghost" class="h-13" @click="emit('leave')">Retour à l'accueil</AppButton>
    </div>
  </section>
</template>
