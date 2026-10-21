---

paths:

  - 'src/**/*.vue'
  - 'src/**/*.js'

---

# Vue

The user is learning Vue 3. Keep the code simple and explain the Vue concepts you use.

## Components

* Use the Composition API with `<script setup>` and plain JavaScript (no TypeScript).
* Prefer `ref`, `computed`, `onMounted` and `onUnmounted`. Always clean up listeners and timers in `onUnmounted`.
* Keep components small and focused. Extract a component only when it is reused or clearly improves readability.
* Pass data with props and communicate upward with events (`defineProps`, `defineEmits`). Do not mutate props.
* Name components in PascalCase, one component per file.
* Use short functions with explicit names.

## State and routing

* Do not add Pinia unless shared state is truly too complex for props, events and a small composable.
* Keep Firebase and RAWG calls out of components: put them in `src/services/`.
* Views live in `src/views/`, reusable components in `src/components/`.

## Keep it simple

* Do not introduce advanced patterns or abstractions (provide/inject, render functions, plugins) without a concrete need.
* Use native `fetch` for HTTP requests.
* Do not add a form, validation, animation or HTTP library.
