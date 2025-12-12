---
title: Frontend Instructions
applyTo: src/frontend/**
---

# Frontend Development Instructions

These rules apply to all code under `src/frontend/`. AI agents and humans must follow them strictly.

---

## Stack & Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Vue 3 | Composition API only, `<script setup>` required |
| State | Pinia | All global/shared state lives in stores |
| UI Library | Vuetify | The **only** allowed component library |

**Testing & quality gates:** Follow `.github/instructions/testing.instructions.md`.

### Forbidden

- React, MUI, Bootstrap, Tailwind, or any other UI framework.
- Vue Options API (`data()`, `methods`, `computed` blocks outside `<script setup>`).
- Direct DOM manipulation (`document.querySelector`, `innerHTML`, etc.).
- Inline styles unless scoped and minimal.
- Global CSS not scoped to a component.

---

## File & Folder Conventions

```
src/frontend/
├── components/   # Reusable UI components
├── views/        # Route-level views
├── stores/       # Pinia stores
├── router/       # Vue Router config
├── composables/  # Shared composition functions
└── App.vue
```

- One component per file.
- Filename matches component name in PascalCase (e.g., `UserCard.vue`).
- Stores use camelCase (e.g., `useUserStore.ts`).

---

## Component Rules

1. **Always use `<script setup lang="ts">`** — no exceptions.
2. **Props** — define with `defineProps<T>()` and explicit types.
3. **Emits** — define with `defineEmits<T>()` and explicit event types.
4. **Reactivity** — use `ref`, `reactive`, `computed`, `watch` from Vue.
5. **Side effects** — use `onMounted`, `onUnmounted` hooks; never raw `setTimeout` without cleanup.
6. **Data fetching** — always via Pinia actions or composables, never inline `fetch` in `<template>`.

### Template rules

- Add `data-test-id` attributes to **all interactive elements** (buttons, inputs, links, modals).
- Prefer Vuetify components (`v-btn`, `v-text-field`, `v-card`, etc.) over raw HTML.
- Use `:key` on all `v-for` loops; keys must be stable and unique.
- Avoid deeply nested ternaries in templates; extract to computed properties.

---

## Pinia Store Rules

1. Define stores using `defineStore` with **setup syntax** (composition style).
2. Export a single `useXxxStore` function per file.
3. Keep state minimal; derive values via `computed`.
4. All async logic (API calls) belongs in **actions**, not components.
5. Never mutate store state directly from components — use actions.

---

## Styling Rules

- Use `<style scoped>` for component styles.
- Prefer Vuetify utility classes and props over custom CSS.
- No Tailwind, no global utility classes.
- If custom CSS is needed, keep selectors shallow (max 2 levels).

---

## Common AI-Agent Mistakes to Avoid

| Mistake | Mitigation |
|---------|------------|
| Using React patterns (`useState`, JSX) | Always use Vue Composition API; never import from `react`. |
| Importing MUI or other UI libs | Only import from `vuetify` and `vue`. |
| Forgetting `data-test-id` | Add to every clickable/inputable element. |
| Inline fetch in template | Move to Pinia action or composable. |
| Large monolithic components | Split into smaller, single-responsibility components. |
| Skipping tests | Every new component/store requires a test file. |
| Using Options API | Always `<script setup>`. |
| Hardcoding strings | Use constants or i18n keys if applicable. |
| Missing `:key` in `v-for` | Always provide a stable, unique key. |
| Direct store mutation | Use store actions only. |

---

## Golden Reference

Follow the example component and store in:

- `src/frontend/components/example/`
- `src/frontend/stores/exampleStore.ts`

Copy their structure for new features.