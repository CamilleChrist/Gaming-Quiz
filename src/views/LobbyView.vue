<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getPlayerId, watchRoom, leaveRoom, startGame } from "../services/firebase";
import { fetchQuestions } from "../services/rawg";

const props = defineProps({
  code: { type: String, required: true },
});

const playerId = ref("");
const meta = ref(null);
const players = ref({});
const loading = ref(true);
const copied = ref(false);
const starting = ref(false);
const startError = ref("");
const router = useRouter();

const inviteLink = computed(() => `${location.origin}/join/${props.code}`);
const isHost = computed(() => meta.value?.hostId === playerId.value);
// Firebase renvoie un objet { uid: joueur } : on le transforme en liste triée par arrivée
const playerList = computed(() =>
  Object.entries(players.value)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => a.joinedAt - b.joinedAt),
);

let unsubscribes = [];

onMounted(async () => {
  // On attend la connexion anonyme : les règles refusent la lecture sans elle
  playerId.value = await getPlayerId();
  unsubscribes = [
    watchRoom(props.code, "meta", (value) => {
      meta.value = value;
      loading.value = false;
      // Quand l'hôte lance la partie, tous les joueurs passent à l'écran de jeu
      if (value?.status === "playing") router.push(`/room/${props.code}/play`);
    }),
    watchRoom(props.code, "players", (value) => (players.value = value ?? {})),
  ];
});

onUnmounted(() => unsubscribes.forEach((unsubscribe) => unsubscribe()));

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value);
  copied.value = true;
}

async function start() {
  starting.value = true;
  startError.value = "";
  try {
    const questions = await fetchQuestions(meta.value.rounds);
    await startGame(props.code, questions);
  } catch (error) {
    console.error(error);
    startError.value = "Impossible de lancer la partie, réessaie.";
    starting.value = false;
  }
}

async function leave() {
  await leaveRoom(props.code, isHost.value);
  router.push("/");
}
</script>

<template>
  <main
    class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10"
  >
    <p v-if="loading" class="text-center text-muted">Chargement du salon…</p>

    <section v-else-if="!meta" class="flex flex-col gap-4 text-center">
      <p>Ce salon n'existe plus.</p>
      <RouterLink to="/" class="font-bold text-pink underline">
        Retour à l'accueil
      </RouterLink>
    </section>

    <template v-else>
      <header class="text-center">
        <p class="text-muted">Code du salon</p>
        <h1 class="text-5xl font-black tracking-widest text-electric">
          {{ code }}
        </h1>
      </header>

      <section class="flex flex-col gap-2 rounded-3xl bg-card p-6">
        <label for="invite-link" class="font-semibold">Lien d'invitation</label>
        <div class="flex gap-2">
          <input
            id="invite-link"
            :value="inviteLink"
            readonly
            class="min-w-0 flex-1 rounded-xl bg-night px-4 py-3 text-muted focus:outline-2 focus:outline-electric"
          />
          <button
            type="button"
            class="rounded-full bg-pink px-5 py-3 font-bold text-night transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
            @click="copyLink"
          >
            Copier
          </button>
        </div>
        <p aria-live="polite" class="text-sm text-pink">
          <template v-if="copied">Lien copié !</template>
        </p>
      </section>

      <section class="flex flex-col gap-4 rounded-3xl bg-card p-6">
        <h2 class="font-semibold">Joueurs {{ playerList.length }}/6</h2>
        <ul class="flex flex-col gap-2">
          <li
            v-for="player in playerList"
            :key="player.id"
            class="flex items-center justify-between rounded-xl bg-night px-4 py-3"
          >
            <span>
              {{ player.name }}
              <span v-if="player.id === playerId" class="text-muted">(toi)</span>
            </span>
            <span
              v-if="player.id === meta.hostId"
              class="rounded-full bg-violet px-3 py-1 text-sm font-bold"
            >
              Hôte
            </span>
          </li>
        </ul>
      </section>

      <button
        v-if="isHost"
        type="button"
        :disabled="starting"
        class="rounded-full bg-electric px-6 py-3 font-bold transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink disabled:cursor-not-allowed disabled:opacity-40"
        @click="start"
      >
        {{ starting ? "Préparation des questions…" : "Lancer la partie" }}
      </button>
      <p v-else class="text-center text-muted">
        En attente du lancement par l'hôte…
      </p>
      <p v-if="startError" role="alert" class="text-center text-sm text-pink">
        {{ startError }}
      </p>

      <button
        type="button"
        class="rounded-full border-2 border-muted px-6 py-3 font-bold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        @click="leave"
      >
        Quitter le salon
      </button>
    </template>
  </main>
</template>
