<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { createRoom, joinRoom } from "../services/firebase";
import AppButton from "../components/AppButton.vue";

const props = defineProps({
  code: { type: String, default: "" },
});

const pseudo = ref("");
const roomCode = ref(props.code);

const hasPseudo = computed(() => pseudo.value.trim() !== "");
const roomCodeValid = computed(() => roomCode.value.trim().length === 6);
const canJoin = computed(() => hasPseudo.value && roomCodeValid.value);

const router = useRouter();
const busy = ref(false);
const errorMessage = ref("");

// Créer ou rejoindre : même déroulé, seule l'action Firebase change
async function goToRoom(enterRoom, failMessage) {
  busy.value = true;
  errorMessage.value = "";
  try {
    const code = await enterRoom();
    router.push(`/room/${code}`);
  } catch (error) {
    console.error(error);
    errorMessage.value = failMessage;
    busy.value = false;
  }
}

function createGame() {
  goToRoom(
    () => createRoom(pseudo.value),
    "Impossible de créer la partie, réessaie.",
  );
}

function joinGame() {
  goToRoom(
    () => joinRoom(roomCode.value.trim().toUpperCase(), pseudo.value),
    "Salon introuvable, complet ou partie déjà lancée.",
  );
}
</script>

<template>
  <!-- Mobile : une colonne. Bureau (lg:) : le logo à gauche, les actions à droite -->
  <main
    class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-7 px-6 py-10 lg:max-w-5xl lg:flex-row lg:items-center lg:gap-20"
  >
    <header class="flex flex-col items-start gap-3.5 lg:flex-1 lg:gap-6">
      <!-- Les deux mots sur une seule ligne : l'espace entre eux est gardé pour les lecteurs d'écran -->
      <h1 class="flex flex-col items-start gap-1.5 font-display leading-none lg:gap-3">
        <span class="-rotate-3 rounded-xl bg-electric px-3.5 pt-1.5 pb-1 text-4xl shadow-block shadow-violet lg:text-6xl">Gaming</span> <span class="text-7xl text-pink lg:text-9xl">Quiz</span>
      </h1>
      <p class="text-lg text-muted lg:max-w-sm lg:text-xl">
        Une capture d'écran, un jeu vidéo à deviner. De 1 à 6 joueurs, sans
        compte.
      </p>
    </header>

    <div class="flex flex-col gap-5 lg:w-md">
      <section
        class="flex flex-col gap-2 rounded-2xl bg-ink p-4.5 text-night shadow-block shadow-violet"
      >
        <label for="pseudo" class="text-sm font-bold tracking-widest uppercase">
          Ton pseudo
        </label>
        <input
          id="pseudo"
          v-model="pseudo"
          maxlength="20"
          autocomplete="nickname"
          placeholder="Player One"
          class="h-13 rounded-xl border-2 border-night px-4 text-lg font-semibold placeholder:text-night/55 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-electric"
        />
      </section>

      <!-- Les deux choix sous le pseudo, qui sert aux deux : empilés sur mobile, côte à côte dès sm:.
           grid-flow-col + auto-cols-fr : autant de colonnes égales que de tuiles (1 si on arrive par une invitation) -->
      <div class="relative grid gap-3 sm:auto-cols-fr sm:grid-flow-col sm:gap-5">
        <!-- Arrivé par un lien d'invitation : on vient pour rejoindre, pas pour créer -->
        <template v-if="!code">
          <AppButton
            :disabled="!hasPseudo || busy"
            class="flex flex-col items-center justify-center gap-3 p-4 leading-tight"
            @click="createGame"
          >
            <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Créer une partie
          </AppButton>

          <!-- Mobile : pastille entre les deux tuiles empilées.
               Dès sm: : posée à cheval entre les deux colonnes (absolute : elle ne prend pas de case dans la grille) -->
          <p
            class="mx-auto grid size-11 place-items-center rounded-full border-2 border-muted/40 bg-night font-display text-sm text-muted sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-1/2"
          >
            ou
          </p>
        </template>

        <section
          class="flex flex-col gap-2.5 rounded-2xl bg-ink p-3.5 text-night shadow-block shadow-pink"
        >
          <h2 class="font-display leading-tight">Rejoindre une partie</h2>
          <label for="room-code" class="text-xs font-bold tracking-widest uppercase">
            Code du salon
          </label>
          <input
            id="room-code"
            v-model="roomCode"
            maxlength="6"
            autocomplete="off"
            placeholder="AB12CD"
            class="h-12 w-full min-w-0 rounded-xl border-2 border-night px-3 font-display text-lg tracking-widest uppercase placeholder:text-night/55 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-electric"
          />
          <AppButton variant="pink" :disabled="!canJoin || busy" class="h-11" @click="joinGame">
            Rejoindre
          </AppButton>
        </section>
      </div>

      <p aria-live="polite" class="min-h-5 text-sm font-semibold text-pink">
        <template v-if="roomCodeValid && !hasPseudo">
          Entre ton pseudo pour rejoindre la partie.
        </template>
        <template v-else-if="errorMessage">{{ errorMessage }}</template>
      </p>
    </div>
  </main>
</template>
