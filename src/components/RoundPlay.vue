<script setup>
import { ref } from "vue";

defineProps({
  imageUrl: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  rounds: { type: Number, required: true },
  secondsLeft: { type: Number, required: true },
  // [{ id, name, answered }] : qui a répondu, sans la réponse
  players: { type: Array, required: true },
});

// Le composant ne parle pas à Firebase : il prévient son parent, qui s'en charge.
const emit = defineEmits(["submit"]);

const answer = ref("");
const sent = ref(false);

function submit() {
  emit("submit", answer.value);
  sent.value = true;
}

// Passer = envoyer une réponse vide : elle compte comme fausse, et le joueur ne peut plus répondre.
function pass() {
  answer.value = "";
  submit();
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <p class="font-semibold text-muted">
        Manche {{ roundNumber }} / {{ rounds }}
      </p>
      <p
        role="timer"
        aria-live="polite"
        class="text-3xl font-black tabular-nums"
        :class="secondsLeft <= 5 ? 'text-pink' : 'text-electric'"
      >
        {{ secondsLeft }} s
      </p>
    </div>

    <img
      :src="imageUrl"
      alt="Capture d'écran du jeu à deviner"
      class="aspect-video w-full rounded-3xl bg-card object-cover"
    />

    <form v-if="!sent && secondsLeft > 0" class="flex gap-2" @submit.prevent="submit">
      <label for="answer" class="sr-only">Titre du jeu</label>
      <input
        id="answer"
        v-model="answer"
        maxlength="100"
        autocomplete="off"
        placeholder="Titre du jeu"
        class="min-w-0 flex-1 rounded-xl bg-card px-4 py-3 placeholder:text-muted focus:outline-2 focus:outline-electric"
      />
      <button
        type="submit"
        :disabled="answer.trim() === ''"
        class="rounded-full bg-electric px-5 py-3 font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:cursor-not-allowed disabled:opacity-40"
      >
        Valider
      </button>
      <button
        type="button"
        class="rounded-full border-2 border-muted px-5 py-3 font-bold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        @click="pass"
      >
        Passer
      </button>
    </form>
    <p v-else aria-live="polite" class="text-center font-bold text-electric">
      <template v-if="!sent">Temps écoulé !</template>
      <template v-else-if="answer">Réponse envoyée !</template>
      <template v-else>Tu passes cette manche.</template>
    </p>

    <ul class="flex flex-wrap justify-center gap-2" aria-label="Joueurs ayant répondu">
      <li
        v-for="player in players"
        :key="player.id"
        class="rounded-full px-3 py-1 text-sm font-bold"
        :class="player.answered ? 'bg-electric' : 'bg-card text-muted'"
      >
        {{ player.name }}<template v-if="player.answered"> ✓</template>
      </li>
    </ul>
  </section>
</template>
