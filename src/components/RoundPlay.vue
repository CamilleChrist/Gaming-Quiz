<script setup>
import { ref, computed, onMounted, useTemplateRef } from "vue";
import AppButton from "./AppButton.vue";

const props = defineProps({
  imageUrl: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  rounds: { type: Number, required: true },
  secondsLeft: { type: Number, required: true },
  secondsPerRound: { type: Number, required: true },
  // [{ id, name, answered }] : qui a répondu, sans la réponse
  players: { type: Array, required: true },
  // Message du parent si l'envoi de la réponse a échoué
  error: { type: String, default: "" },
});

// Le composant ne parle pas à Firebase : il prévient son parent, qui s'en charge.
const emit = defineEmits(["submit"]);

const answer = ref("");
const sent = ref(false);
const answerInput = useTemplateRef("answer-input");

// Le composant est recréé à chaque manche (:key dans RoomView) : le curseur se place dans le champ à chaque fois.
onMounted(() => answerInput.value?.focus());

// Annoncer le chrono chaque seconde serait pénible avec un lecteur d'écran : seulement à 10 s et 5 s.
const timerAnnouncement = computed(() =>
  [10, 5].includes(props.secondsLeft) ? `Plus que ${props.secondsLeft} secondes` : "",
);

// Barre du chrono en 10 segments, comme une jauge de vie ; elle passe au rose dans les 5 dernières secondes.
const SEGMENTS = 10;
const litSegments = computed(() => Math.ceil((props.secondsLeft / props.secondsPerRound) * SEGMENTS));
const urgent = computed(() => props.secondsLeft <= 5);

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
  <section class="mx-auto grid w-full max-w-2xl grid-cols-1 gap-5 lg:max-w-5xl lg:grid-cols-5 lg:items-start lg:gap-x-10">
    <div class="flex flex-col gap-2.5 lg:col-span-5">
      <div class="flex items-end justify-between">
        <p class="flex flex-col text-sm font-bold tracking-widest text-muted uppercase">
          Manche
          <span class="font-display text-2xl tracking-normal text-ink">{{ roundNumber }} / {{ rounds }}</span>
        </p>
        <p
          role="timer"
          class="font-display text-5xl leading-none tabular-nums transition-colors"
          :class="urgent ? 'text-pink motion-safe:animate-beat' : 'text-ink'"
        >
          {{ secondsLeft }}<span class="font-sans text-3xl font-bold"> s</span>
        </p>
        <p class="sr-only" aria-live="polite">{{ timerAnnouncement }}</p>
      </div>
      <!-- v-for sur un nombre : segment vaut 1, 2… 10 -->
      <div class="grid grid-cols-10 gap-1" aria-hidden="true">
        <span
          v-for="segment in SEGMENTS"
          :key="segment"
          class="h-3.5 rounded-sm transition-colors"
          :class="segment > litSegments ? 'bg-card' : urgent ? 'bg-pink' : 'bg-electric'"
        ></span>
      </div>
    </div>

    <!-- Le composant est recréé à chaque manche : l'animation rejoue à chaque nouvelle capture -->
    <div class="rounded-2xl bg-ink p-2 shadow-block shadow-electric motion-safe:animate-deal lg:col-span-3">
      <img
        :src="imageUrl"
        alt="Capture d'écran du jeu à deviner"
        class="aspect-video w-full rounded-xl bg-card object-cover"
      />
    </div>

    <!-- Bureau : réponse et joueurs dans la colonne de droite -->
    <div class="flex flex-col gap-5 lg:col-span-2">
      <form
        v-if="!sent && secondsLeft > 0"
        class="flex flex-col gap-2.5 rounded-2xl bg-ink p-4 text-night shadow-block shadow-pink"
        @submit.prevent="submit"
      >
        <label for="answer" class="text-sm font-bold tracking-widest uppercase">Titre du jeu</label>
        <input
          id="answer"
          ref="answer-input"
          v-model="answer"
          maxlength="100"
          autocomplete="off"
          placeholder="Titre du jeu"
          class="h-13 rounded-xl border-2 border-night px-3.5 text-lg font-semibold placeholder:text-night/55 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-electric"
        />
        <div class="flex gap-2">
          <AppButton type="submit" :disabled="answer.trim() === ''" class="h-13 flex-1">
            Valider
          </AppButton>
          <AppButton variant="outline" class="h-13 px-4.5" @click="pass">Passer</AppButton>
        </div>
      </form>
      <!-- min-h : le tampon occupe à peu près la place du formulaire, rien ne saute en dessous -->
      <div v-else class="grid min-h-44 place-items-center">
        <p
          aria-live="polite"
          class="flex max-w-sm items-center gap-3 rounded-2xl border-4 bg-ink px-6 py-4 text-center font-display text-xl text-night motion-safe:animate-stamp"
          :class="error ? 'border-pink' : sent && answer ? 'border-electric' : 'border-muted'"
        >
          <svg
            v-if="sent && answer && !error"
            class="size-7 shrink-0 stroke-electric"
            viewBox="0 0 24 24"
            fill="none"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <template v-if="error">{{ error }}</template>
          <template v-else-if="!sent">Temps écoulé !</template>
          <template v-else-if="answer">Réponse envoyée !</template>
          <template v-else>Tu passes cette manche.</template>
        </p>
      </div>

      <section class="flex flex-col gap-2">
        <h2 class="text-sm font-bold tracking-widest text-muted uppercase">Joueurs ayant répondu</h2>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="player in players"
            :key="player.id"
            class="flex items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-sm font-bold"
            :class="player.answered ? 'border-ink bg-ink text-night' : 'border-dashed border-muted/50 text-muted'"
          >
            <svg
              v-if="player.answered"
              class="size-3.5 stroke-electric"
              viewBox="0 0 24 24"
              fill="none"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              role="img"
              aria-label="a répondu"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {{ player.name }}
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
