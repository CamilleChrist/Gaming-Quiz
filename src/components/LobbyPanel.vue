<script setup>
import { ref, computed, useTemplateRef } from "vue";
import { startGame, updateSettings } from "../services/firebase";
import { fetchQuestions } from "../services/rawg";
import AppButton from "./AppButton.vue";

const props = defineProps({
  code: { type: String, required: true },
  meta: { type: Object, required: true },
  players: { type: Object, required: true },
  playerId: { type: String, required: true },
  isHost: { type: Boolean, default: false },
});

const emit = defineEmits(["leave"]);

const copyMessage = ref("");
const inviteInput = useTemplateRef("invite-input"); // L'élément <input ref="invite-input"> du template
const starting = ref(false);
const startError = ref("");

const inviteLink = computed(() => `${location.origin}/join/${props.code}`);
// Firebase renvoie un objet { uid: joueur } : on le transforme en liste triée par arrivée
const playerList = computed(() =>
  Object.entries(props.players)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => a.joinedAt - b.joinedAt),
);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copyMessage.value = "Lien copié !";
  } catch {
    // Presse-papiers indisponible (site ouvert en http sur un téléphone, permission refusée…) :
    // on sélectionne le lien pour que le joueur le copie lui-même.
    inviteInput.value.select();
    copyMessage.value = "Copie automatique impossible : le lien est sélectionné, copie-le à la main.";
  }
}

async function start() {
  starting.value = true;
  startError.value = "";
  try {
    const questions = await fetchQuestions(props.meta.rounds);
    await startGame(props.code, questions, props.meta.secondsPerRound);
  } catch (error) {
    console.error(error);
    startError.value = "Impossible de lancer la partie, réessaie.";
    starting.value = false;
  }
}

const ROUND_CHOICES = [5, 10, 15];
const SECONDS_CHOICES = [15, 30, 45];

// Le réglage choisi vient de Firebase ; on n'écrit dans Firebase que quand l'hôte clique sur un autre choix.
// Tous les joueurs voient alors le nouveau réglage en temps réel.
function changeSetting(name, value) {
  updateSettings(props.code, { [name]: value });
}

// Bouton de réglage : choisi ou non, modifiable (hôte) ou seulement visible (invités)
function settingClass(selected) {
  if (selected) {
    return props.isHost
      ? "border-electric bg-electric shadow-key-sm shadow-night"
      : "border-muted bg-muted text-night";
  }
  return props.isHost ? "border-ink hover:bg-ink/10" : "border-dashed border-muted/40 text-muted";
}

// Couleur de l'ombre d'une tuile joueur : violet pour l'hôte, rose pour soi, bleu pour les autres
function playerShadow(player) {
  if (player.id === props.meta.hostId) return "shadow-violet";
  return player.id === props.playerId ? "shadow-pink" : "shadow-electric";
}
</script>

<template>
  <!-- Mobile : une colonne. Bureau : salon et joueurs à gauche, réglages et lancement à droite -->
  <div class="mx-auto grid w-full max-w-md grid-cols-1 gap-6 lg:max-w-4xl lg:grid-cols-2 lg:gap-x-12">
    <div class="flex flex-col gap-6">
      <header class="flex flex-col gap-2.5">
        <p class="text-sm font-bold tracking-widest text-muted uppercase">Code du salon</p>
        <!-- v-for sur une chaîne de caractères : une tuile par lettre du code -->
        <h1 class="flex gap-2 font-display text-3xl">
          <span
            v-for="(char, index) in code"
            :key="index"
            class="grid h-14.5 flex-1 place-items-center rounded-lg bg-ink text-night shadow-block-sm shadow-electric"
          >
            {{ char }}
          </span>
        </h1>
      </header>

      <section class="flex flex-col gap-2">
        <label for="invite-link" class="text-sm font-bold tracking-widest text-muted uppercase">
          Lien d'invitation
        </label>
        <div class="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted/50 py-1.5 pr-1.5 pl-3.5">
          <input
            id="invite-link"
            ref="invite-input"
            :value="inviteLink"
            readonly
            class="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium focus-visible:outline-none"
          />
          <AppButton variant="pink" class="h-11 px-4" @click="copyLink">Copier</AppButton>
        </div>
        <p aria-live="polite" class="min-h-5 text-sm font-bold text-pink">{{ copyMessage }}</p>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="flex items-baseline justify-between text-sm font-bold tracking-widest text-muted uppercase">
          Joueurs
          <span class="font-display text-2xl tracking-normal text-ink">{{ playerList.length }}/6</span>
        </h2>
        <!-- aria-live : les lecteurs d'écran annoncent les arrivées et départs -->
        <ul class="grid grid-cols-2 gap-3" aria-live="polite">
          <li
            v-for="player in playerList"
            :key="player.id"
            class="flex h-17 flex-col justify-center gap-0.5 rounded-xl bg-ink px-3.5 text-night shadow-block-sm"
            :class="playerShadow(player)"
          >
            <span
              v-if="player.id === meta.hostId"
              class="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
            >
              <svg class="size-3.5 fill-violet stroke-night" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
                <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
              </svg>
              Hôte
            </span>
            <span class="truncate font-bold">
              {{ player.name }}
              <span v-if="player.id === playerId" class="font-medium">(toi)</span>
            </span>
          </li>
          <!-- v-for sur un nombre : une case vide par place libre -->
          <li
            v-for="slot in 6 - playerList.length"
            :key="`free-${slot}`"
            aria-hidden="true"
            class="h-17 rounded-xl border-2 border-dashed border-muted/35"
          ></li>
        </ul>
      </section>
    </div>

    <div class="flex flex-col gap-6 lg:justify-center">
      <!-- Seul l'hôte peut modifier les réglages ; les autres les voient sans pouvoir y toucher -->
      <section class="flex flex-col gap-4 rounded-2xl bg-card p-4.5">
        <div role="group" aria-labelledby="rounds-label" class="flex flex-col gap-2">
          <span id="rounds-label" class="text-sm font-bold tracking-widest uppercase">Manches</span>
          <div class="flex gap-2">
            <button
              v-for="choice in ROUND_CHOICES"
              :key="choice"
              type="button"
              :disabled="!isHost"
              :aria-pressed="choice === meta.rounds"
              class="h-11 flex-1 rounded-lg border-2 font-display text-lg transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pink"
              :class="settingClass(choice === meta.rounds)"
              @click="changeSetting('rounds', choice)"
            >
              {{ choice }}
            </button>
          </div>
        </div>
        <div role="group" aria-labelledby="seconds-label" class="flex flex-col gap-2">
          <span id="seconds-label" class="text-sm font-bold tracking-widest uppercase">Temps par manche</span>
          <div class="flex gap-2">
            <button
              v-for="choice in SECONDS_CHOICES"
              :key="choice"
              type="button"
              :disabled="!isHost"
              :aria-pressed="choice === meta.secondsPerRound"
              class="h-11 flex-1 rounded-lg border-2 font-display text-lg transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-pink"
              :class="settingClass(choice === meta.secondsPerRound)"
              @click="changeSetting('secondsPerRound', choice)"
            >
              {{ choice }}<span class="font-sans font-bold"> s</span>
            </button>
          </div>
        </div>
      </section>

      <div class="flex flex-col gap-3">
        <AppButton v-if="isHost" :disabled="starting" class="h-15 px-4" @click="start">
          {{ starting ? "Préparation des questions…" : "Lancer la partie" }}
        </AppButton>
        <p
          v-else
          class="flex h-15 items-center justify-center gap-2.5 rounded-2xl border-2 border-electric px-4 text-center font-bold"
        >
          <span class="size-2.5 shrink-0 rounded-full bg-pink motion-safe:animate-pulse" aria-hidden="true"></span>
          En attente du lancement par l'hôte…
        </p>
        <p v-if="startError" role="alert" class="text-center text-sm font-bold text-pink">
          {{ startError }}
        </p>

        <AppButton variant="ghost" class="h-13" @click="emit('leave')">Quitter le salon</AppButton>
      </div>
    </div>
  </div>
</template>
