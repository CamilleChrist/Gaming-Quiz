<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  code: { type: String, default: "" },
});

const pseudo = ref("");
const roomCode = ref(props.code);

const hasPseudo = computed(() => pseudo.value.trim() !== "");
const canJoin = computed(
  () => hasPseudo.value && roomCode.value.trim().length === 6,
);
</script>

<template>
  <main
    class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10"
  >
    <header class="text-center">
      <h1
        class="bg-linear-to-r from-electric to-pink bg-clip-text text-5xl font-black text-transparent"
      >
        Gaming Quiz
      </h1>
      <p class="mt-3 text-muted">
        Une capture d'écran, un jeu vidéo à deviner. De 1 à 6 joueurs, sans
        compte.
      </p>
    </header>

    <section class="flex flex-col gap-6 rounded-3xl bg-card p-6">
      <div class="flex flex-col gap-2">
        <label for="pseudo" class="font-semibold">Ton pseudo</label>
        <input
          id="pseudo"
          v-model="pseudo"
          maxlength="20"
          autocomplete="nickname"
          placeholder="Player One"
          class="rounded-xl bg-night px-4 py-3 placeholder:text-muted focus:outline-2 focus:outline-electric"
        />
      </div>

      <button
        type="button"
        :disabled="!hasPseudo"
        class="rounded-full bg-electric px-6 py-3 font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:cursor-not-allowed disabled:opacity-40"
      >
        Créer une partie
      </button>

      <div class="flex flex-col gap-2">
        <label for="room-code" class="font-semibold">Code du salon</label>
        <div class="flex gap-2">
          <input
            id="room-code"
            v-model="roomCode"
            maxlength="6"
            autocomplete="off"
            placeholder="AB12CD"
            class="min-w-0 flex-1 rounded-xl bg-night px-4 py-3 tracking-widest uppercase placeholder:text-muted focus:outline-2 focus:outline-electric"
          />
          <button
            type="button"
            :disabled="!canJoin"
            class="rounded-full bg-pink px-5 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric disabled:cursor-not-allowed disabled:opacity-40"
          >
            Rejoindre
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
