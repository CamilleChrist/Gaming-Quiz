<script setup>
// Bouton commun à toute l'application : il porte le style (couleurs, ombre, effet d'appui, focus).
// La taille et la mise en page restent au parent, via class="h-13 px-4…".
// Tout ce que le parent ajoute (class, type="submit", :disabled, @click…) est transmis au <button> tout seul.
defineProps({
  variant: { type: String, default: "primary" },
});

const VARIANTS = {
  // Action principale : grosse touche bleue
  primary:
    "rounded-2xl bg-electric font-display text-lg text-ink shadow-key shadow-electric/45 enabled:hover:brightness-110 focus-visible:outline-pink",
  // Touche rose cerclée de bleu nuit
  pink: "rounded-xl border-2 border-night bg-pink font-bold text-night shadow-key-sm shadow-night enabled:hover:brightness-110 focus-visible:outline-electric",
  // Bouton discret sur une carte claire
  outline:
    "rounded-xl border-2 border-night font-bold text-night enabled:hover:bg-night/10 focus-visible:outline-electric",
  // Bouton discret sur le fond sombre
  ghost:
    "rounded-2xl border-2 border-muted font-bold text-muted enabled:hover:text-ink focus-visible:outline-pink",
};
</script>

<template>
  <button
    type="button"
    class="transition focus-visible:outline-3 focus-visible:outline-offset-2 enabled:active:translate-y-1 enabled:active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
    :class="VARIANTS[variant]"
  >
    <slot />
  </button>
</template>
