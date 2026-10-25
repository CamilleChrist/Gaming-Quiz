<script setup>
import { ref } from "vue";

defineProps({
  imageUrl: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  rounds: { type: Number, required: true },
  isHost: { type: Boolean, default: false },
});

// Le composant ne parle pas à Firebase : il prévient son parent, qui s'en charge.
const emit = defineEmits(["submit", "reveal"]);

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
    <p class="text-center font-semibold text-muted">
      Manche {{ roundNumber }} / {{ rounds }}
    </p>

    <img
      :src="imageUrl"
      alt="Capture d'écran du jeu à deviner"
      class="aspect-video w-full rounded-3xl bg-card object-cover"
    />

    <form v-if="!sent" class="flex gap-2" @submit.prevent="submit">
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
      {{ answer ? "Réponse envoyée !" : "Tu passes cette manche." }}
    </p>

    <!-- Temporaire : le chrono déclenchera la révélation à l'étape suivante -->
    <button
      v-if="isHost"
      type="button"
      class="rounded-full bg-pink px-6 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
      @click="emit('reveal')"
    >
      Révéler la réponse
    </button>
  </section>
</template>
