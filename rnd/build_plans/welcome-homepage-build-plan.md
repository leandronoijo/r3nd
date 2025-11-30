# Build Plan: `welcome-homepage`

> **Source:** `rnd/tech_specs/welcome-homepage-tech-spec.md`  
> **Created:** 2025-11-30  
> **Status:** Draft

---

## 0. Pre-Implementation Checklist

Complete these items **before** starting any implementation tasks.

- [ ] Read `.github/instructions/frontend.instructions.md`
- [ ] Read `.github/instructions/backend.instructions.md` (for reference only — this feature is frontend-only)
- [ ] Identify golden reference modules:
  - Frontend: `src/frontend/components/example/`, `src/frontend/stores/exampleStore.ts`
- [ ] Confirm no new dependencies needed (or justify additions below)
- [ ] Review tech spec for any open questions
- [ ] Verify repository has no existing `src/frontend/` directory (this feature creates the initial structure)

### New Dependencies

| Package | Purpose | Justification |
|---------|---------|---------------|
| `vue@3.x` | Frontend framework | Required — Vue 3 Composition API per frontend.instructions.md |
| `vuetify@3.x` | UI component library | Required — Only allowed UI library per frontend.instructions.md |
| `vue-router@4.x` | Client-side routing | Required — Needed for SPA navigation |
| `vite@5.x` | Build tool | Required — Modern Vue 3 default build tool (tech spec decision) |
| `@mdi/font` | Material Design Icons | Required — Icon library bundled with Vuetify |

> **Note:** These are foundational dependencies for the first frontend implementation. They establish the Vue 3 + Vuetify + Vue Router stack required by `.github/instructions/frontend.instructions.md`.

---

## 1. Implementation Overview

**Approach:** This is a frontend-only feature that creates the initial `src/frontend/` directory structure. The welcome homepage is a static marketing page with no backend API dependencies. All content is hardcoded in Vue components, and no Pinia store is needed since there is no dynamic state.

**Key Decisions:**
- **Separate section components** instead of a monolithic HomePage — Better maintainability, reusability, and testability
- **No Pinia store** — All content is static; a store can be added later if dynamic content (e.g., repo stats) is needed
- **`v-stepper` for pipeline visualization** — Semantically appropriate for step-by-step workflows, supports mobile vertical layout
- **Native Clipboard API for copy functionality** — Modern browsers support it; no third-party library needed

**Integration Points:**

| Existing Module | Integration Type | Notes |
|-----------------|------------------|-------|
| N/A | — | This is the first frontend feature; no existing modules to integrate with |

---

## 2. Task Breakdown

### Phase 1: Project Foundation

#### Task 1: Initialize Vue 3 Project with Vite

- [ ] **Initialize project and install dependencies**
- **File(s):** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- **Action:** create
- **Dependencies:** None
- **Details:**
  - Run `npm create vite@latest` with Vue + TypeScript template (or manually create files)
  - Install dependencies:
    - `vue@^3.4`
    - `vue-router@^4.2`
    - `vuetify@^3.4`
    - `@mdi/font@^7.4`
  - Configure `vite.config.ts`:
    - Set `root` to `src/frontend/`
    - Configure path alias `@` → `src/frontend/`
    - Configure Vuetify plugin
  - Configure `tsconfig.json`:
    - Enable strict mode
    - Set path alias for `@`
  - Create `index.html` at repository root with `<div id="app">` and script entry point
- **Acceptance Criteria:**
  - `npm install` completes without errors
  - `npm run dev` starts development server
  - Empty Vue app renders in browser
- **Effort:** medium
- ⚠️ **Warning:** Do not install React, MUI, Bootstrap, or Tailwind. Only Vue 3 + Vuetify is allowed.

---

#### Task 2: Create main.ts Entry Point

- [ ] **Create application entry point**
- **File(s):** `src/frontend/main.ts`
- **Action:** create
- **Dependencies:** Task 1
- **Golden Reference:** Standard Vue 3 + Vuetify setup
- **Details:**
  - Import `createApp` from `vue`
  - Import and register `createVuetify` from `vuetify`
  - Import router from `./router`
  - Import `App.vue` as root component
  - Import Vuetify styles: `vuetify/styles`
  - Import MDI icons: `@mdi/font/css/materialdesignicons.css`
  - Mount app to `#app`
  - Code structure:
    ```typescript
    import { createApp } from 'vue';
    import { createVuetify } from 'vuetify';
    import * as components from 'vuetify/components';
    import * as directives from 'vuetify/directives';
    import 'vuetify/styles';
    import '@mdi/font/css/materialdesignicons.css';
    import App from './App.vue';
    import router from './router';

    const vuetify = createVuetify({ components, directives });
    const app = createApp(App);
    app.use(vuetify);
    app.use(router);
    app.mount('#app');
    ```
- **Acceptance Criteria:**
  - File compiles without TypeScript errors
  - Vuetify and Vue Router are registered
  - App mounts successfully
- **Effort:** small

---

#### Task 3: Create App.vue Root Component

- [ ] **Create root application component**
- **File(s):** `src/frontend/App.vue`
- **Action:** create
- **Dependencies:** Task 2
- **Golden Reference:** `src/frontend/components/example/` (if exists)
- **Details:**
  - Use `<script setup lang="ts">` — **required**
  - Wrap content in `<v-app>` (Vuetify application wrapper)
  - Include `<router-view />` for route rendering
  - Minimal styling — let child components handle their own styles
  - Code structure:
    ```vue
    <script setup lang="ts">
    // No imports needed for static root
    </script>

    <template>
      <v-app>
        <v-main>
          <router-view />
        </v-main>
      </v-app>
    </template>

    <style scoped>
    /* Minimal or no custom styles */
    </style>
    ```
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Wraps content in `<v-app>` and `<v-main>`
  - Contains `<router-view />`
  - No React imports, no Options API
- **Effort:** small

---

#### Task 4: Create Router Configuration

- [ ] **Create Vue Router setup**
- **File(s):** `src/frontend/router/index.ts`
- **Action:** create
- **Dependencies:** Task 3
- **Details:**
  - Import `createRouter`, `createWebHistory` from `vue-router`
  - Define single route: `'/'` → `HomePage.vue`
  - Use `createWebHistory()` for clean URLs
  - Code structure:
    ```typescript
    import { createRouter, createWebHistory } from 'vue-router';
    import HomePage from '@/views/HomePage.vue';

    const routes = [
      {
        path: '/',
        name: 'home',
        component: HomePage
      }
    ];

    const router = createRouter({
      history: createWebHistory(),
      routes
    });

    export default router;
    ```
- **Acceptance Criteria:**
  - Router exports default router instance
  - Root path maps to HomePage component
  - Uses `createWebHistory` (not hash mode)
- **Effort:** small

---

### Phase 2: Section Components

> **Note:** Tasks 5-10 can be implemented in parallel after Task 4 is complete.

#### Task 5: Create HeroSection Component

- [ ] **Create HeroSection.vue**
- **File(s):** `src/frontend/components/home/HeroSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Content:
    - Headline: "AI-Driven R&D Pipeline"
    - Tagline: "From Idea to Code — Automated, Traceable, Human-Controlled"
  - Vuetify components:
    - `v-container` — fluid, full-width
    - `v-row` — justify center, align center
    - `v-col` — cols="12", text center
  - Styling: Large headline (text-h2 or h3), subtitle for tagline
  - Required `data-test-id` attributes:
    - `hero-section` — on root container
    - `hero-headline` — on headline text element
    - `hero-tagline` — on tagline text element
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays headline and tagline
  - All three `data-test-id` attributes present
  - Uses only Vuetify components
  - Responsive — centered on all screen sizes
- **Effort:** small

---

#### Task 6: Create FeaturesSection Component

- [ ] **Create FeaturesSection.vue**
- **File(s):** `src/frontend/components/home/FeaturesSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Section title: "What This Project Provides"
  - 5 feature cards with icon, title, and description:
    1. **Out-of-the-box Personas** — `mdi-account-group` — "Four Copilot personas (Product Manager, Architect, Team Lead, Developer) with strict roles and designated output paths."
    2. **End-to-end Multi-stage Workflow** — `mdi-sitemap` — "A chained pipeline: Product Spec → Tech Spec → Build Plan → Code, with human-controlled PR gates at every stage."
    3. **Clear R&D Artifact Structure** — `mdi-folder-outline` — "Complete traceability under rnd/: product_specs, tech_specs, build_plans, history."
    4. **Real Application Structure** — `mdi-code-braces` — "Application code under src/ and tests under tests/, modified only by the Developer persona."
    5. **Repo-wide & Path-specific Copilot Rules** — `mdi-cog-outline` — "Define stack-specific rules via .github/instructions without touching personas."
  - Vuetify components:
    - `v-container`
    - `v-row` with responsive breakpoints
    - `v-col` — `cols="12"`, `sm="6"`, `md="4"` for responsive grid
    - `v-card` for each feature
    - `v-icon` for feature icons
    - `v-card-title`, `v-card-text`
  - Use `v-for` with `:key` to iterate over features array
  - Required `data-test-id` attributes:
    - `features-section` — on root container
    - `feature-card-0` through `feature-card-4` — on each card
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays 5 feature cards with icon, title, description
  - Responsive grid: 1 col on mobile, 2-3 on tablet/desktop
  - All `data-test-id` attributes present (section + 5 cards)
  - Uses `v-for` with unique `:key` attribute
- **Effort:** medium

---

#### Task 7: Create DifferentiatorsSection Component

- [ ] **Create DifferentiatorsSection.vue**
- **File(s):** `src/frontend/components/home/DifferentiatorsSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Section title: "Why Choose This Seed Project"
  - 4 differentiator cards:
    1. **Human-in-the-loop Safety** — `mdi-shield-check` — "No code is merged without human review. Every PR gate requires approval."
    2. **Deterministic Persona Behavior** — `mdi-target` — "Each persona has a narrow scope and cannot spill into other roles."
    3. **Full Traceability** — `mdi-link-variant` — "Every feature produces a complete chain: Product Spec → Tech Spec → Build Plan → Code."
    4. **Technology Independence** — `mdi-puzzle-outline` — "The template does not assume any language or framework. All tech constraints live in your .github/instructions files."
  - Vuetify components:
    - `v-container`
    - `v-row`
    - `v-col` — `cols="12"`, `sm="6"`, `lg="3"` for responsive grid
    - `v-card` for each differentiator
    - `v-icon`
  - Required `data-test-id` attributes:
    - `differentiators-section` — on root container
    - `differentiator-card-0` through `differentiator-card-3` — on each card
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays 4 differentiator cards
  - Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop
  - All `data-test-id` attributes present
- **Effort:** medium

---

#### Task 8: Create PipelineSection Component

- [ ] **Create PipelineSection.vue**
- **File(s):** `src/frontend/components/home/PipelineSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Section title: "How the Pipeline Works"
  - Pipeline steps using `v-stepper`:
    1. **GitHub Issue** — `mdi-github` — "Create an issue describing your feature"
    2. **Product Manager** — `mdi-clipboard-text` — "Generates Product Spec → PR #1"
    3. **Architect** — `mdi-drawing` — "Generates Tech Spec → PR #2"
    4. **Team Lead** — `mdi-format-list-checks` — "Generates Build Plan → PR #3"
    5. **Developer** — `mdi-code-tags` — "Generates Code + Tests → PR #4"
    6. **Feature Merged** — `mdi-check-circle` — "Human-approved and merged"
  - Vuetify components:
    - `v-container`
    - `v-stepper` with `alt-labels` prop for horizontal layout
    - `v-stepper-header`, `v-stepper-item` for each step
    - Use `:mobile` prop or responsive breakpoints for vertical on mobile
  - Required `data-test-id` attributes:
    - `pipeline-section` — on root container
    - `pipeline-step-0` through `pipeline-step-5` — on each stepper item
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays 6 pipeline steps in stepper format
  - Horizontal on desktop, vertical on mobile (Vuetify handles this with responsive props)
  - All `data-test-id` attributes present
  - No editable/interactive stepper — display only (use `:non-linear` or similar)
- **Effort:** medium

---

#### Task 9: Create QuickStartSection Component

- [ ] **Create QuickStartSection.vue**
- **File(s):** `src/frontend/components/home/QuickStartSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Section title: "Quick Start"
  - 4 steps with code blocks and copy buttons:
    1. **Clone repository:**
       ```bash
       git clone https://github.com/your-org/your-repo.git
       ```
    2. **Customize your stack rules:**
       ```bash
       # Edit .github/copilot-instructions.md
       # Edit .github/instructions/*.instructions.md
       ```
    3. **Add your application code:**
       ```bash
       # Place code under src/ and tests/
       ```
    4. **Start a feature:**
       ```bash
       # Create a GitHub Issue describing your feature
       # The pipeline will automatically begin
       ```
  - Copy functionality:
    - Use `navigator.clipboard.writeText()` API
    - Show feedback on copy (brief tooltip or icon change)
  - Vuetify components:
    - `v-container`
    - `v-card` for each step
    - `v-card-title` for step title
    - `v-card-text` containing `<pre><code>` for command
    - `v-btn` with `icon` prop for copy button
  - Required `data-test-id` attributes:
    - `quickstart-section` — on root container
    - `quickstart-step-0` through `quickstart-step-3` — on each step card
    - `copy-button-0` through `copy-button-3` — on each copy button
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays 4 Quick Start steps with code blocks
  - Copy button works (uses Clipboard API)
  - All `data-test-id` attributes present (section + 4 steps + 4 buttons)
  - Code blocks are readable and properly formatted
- **Effort:** medium
- ⚠️ **Warning:** Use native `navigator.clipboard.writeText()`, not a third-party library. Handle the async nature properly (it returns a Promise).

---

#### Task 10: Create CtaSection Component

- [ ] **Create CtaSection.vue**
- **File(s):** `src/frontend/components/home/CtaSection.vue`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Use `<script setup lang="ts">`
  - Section title: Optional (can be implicit)
  - 3 call-to-action buttons:
    1. **Get Started** — Primary/prominent styling — links to README or docs
    2. **View Documentation** — Secondary styling — links to `docs/` directory
    3. **Contribute** — Outlined styling — links to CONTRIBUTING or GitHub Issues
  - Vuetify components:
    - `v-container`
    - `v-row` — justify center
    - `v-col` — auto sizing
    - `v-btn` for each CTA with appropriate `variant` props (elevated, tonal, outlined)
  - Links:
    - Use `href` attribute for external navigation
    - Add `target="_blank"` and `rel="noopener noreferrer"` for external links
  - Responsive: Stacked on mobile, horizontal on desktop (`flex-column flex-sm-row`)
  - Required `data-test-id` attributes:
    - `cta-section` — on root container
    - `cta-get-started` — on Get Started button
    - `cta-documentation` — on Documentation button
    - `cta-contribute` — on Contribute button
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Displays 3 CTA buttons with appropriate styling
  - Buttons are links (not fake buttons)
  - All `data-test-id` attributes present
  - External links include security attributes
- **Effort:** small

---

### Phase 3: Integration

#### Task 11: Create HomePage View

- [ ] **Create HomePage.vue**
- **File(s):** `src/frontend/views/HomePage.vue`
- **Action:** create
- **Dependencies:** Tasks 5-10 (all section components)
- **Details:**
  - Use `<script setup lang="ts">`
  - Import all 6 section components
  - Compose sections in order:
    1. `<HeroSection />`
    2. `<FeaturesSection />`
    3. `<DifferentiatorsSection />`
    4. `<PipelineSection />`
    5. `<QuickStartSection />`
    6. `<CtaSection />`
  - Wrap in `v-container` if needed for consistent spacing
  - Add spacing between sections using Vuetify margin utilities or `v-spacer`
  - Required `data-test-id` attribute:
    - `homepage` — on root container
- **Acceptance Criteria:**
  - Uses `<script setup lang="ts">`
  - Imports and renders all 6 section components
  - Sections render in correct order
  - Page is scrollable and all sections visible
  - `data-test-id="homepage"` present on root
- **Effort:** small

---

### Phase 4: Testing

#### Task 12: Create HeroSection Unit Test

- [ ] **Create HeroSection.spec.ts**
- **File(s):** `tests/frontend/components/home/HeroSection.spec.ts`
- **Action:** create
- **Dependencies:** Task 5
- **Details:**
  - Import `mount` from `@vue/test-utils`
  - Import `createVuetify` and configure for tests
  - Test cases:
    - Renders headline text "AI-Driven R&D Pipeline"
    - Renders tagline text "From Idea to Code — Automated, Traceable, Human-Controlled"
    - Contains `data-test-id="hero-section"`
    - Contains `data-test-id="hero-headline"`
    - Contains `data-test-id="hero-tagline"`
- **Acceptance Criteria:**
  - All test cases pass
  - Uses `@vue/test-utils` `mount`
  - Properly configures Vuetify for testing
- **Effort:** small

---

#### Task 13: Create Section Component Unit Tests

- [ ] **Create remaining section unit tests**
- **File(s):**
  - `tests/frontend/components/home/FeaturesSection.spec.ts`
  - `tests/frontend/components/home/DifferentiatorsSection.spec.ts`
  - `tests/frontend/components/home/PipelineSection.spec.ts`
  - `tests/frontend/components/home/QuickStartSection.spec.ts`
  - `tests/frontend/components/home/CtaSection.spec.ts`
- **Action:** create
- **Dependencies:** Tasks 6-10
- **Details:**
  - **FeaturesSection.spec.ts:**
    - Renders all 5 feature cards
    - Each card has title and description
    - Contains `data-test-id="features-section"`
    - Contains `data-test-id="feature-card-{0-4}"` for each card
  - **DifferentiatorsSection.spec.ts:**
    - Renders all 4 differentiator cards
    - Contains appropriate `data-test-id` attributes
  - **PipelineSection.spec.ts:**
    - Renders 6 pipeline steps
    - Contains `data-test-id="pipeline-section"`
    - Contains `data-test-id="pipeline-step-{0-5}"` for each step
  - **QuickStartSection.spec.ts:**
    - Renders 4 Quick Start steps
    - Each step has a copy button
    - Copy button triggers clipboard action (mock `navigator.clipboard`)
    - Contains all required `data-test-id` attributes
  - **CtaSection.spec.ts:**
    - Renders 3 CTA buttons
    - Buttons have correct labels
    - Buttons have href attributes
    - Contains all required `data-test-id` attributes
- **Acceptance Criteria:**
  - All test files created
  - All test cases pass
  - Uses proper Vuetify test setup
  - Mocks `navigator.clipboard` for QuickStartSection
- **Effort:** medium

---

#### Task 14: Create HomePage View Unit Test

- [ ] **Create HomePage.spec.ts**
- **File(s):** `tests/frontend/views/HomePage.spec.ts`
- **Action:** create
- **Dependencies:** Task 11, Task 13
- **Details:**
  - Test cases:
    - Renders without errors
    - Contains all 6 section components
    - Contains `data-test-id="homepage"`
    - Sections render in correct order (Hero → Features → Differentiators → Pipeline → QuickStart → CTA)
  - Use `findComponent` or `data-test-id` selectors to verify sections
- **Acceptance Criteria:**
  - All test cases pass
  - Verifies all sections are present
  - Verifies correct order of sections
- **Effort:** small

---

#### Task 15: Create Router Unit Test

- [ ] **Create router/index.spec.ts**
- **File(s):** `tests/frontend/router/index.spec.ts`
- **Action:** create
- **Dependencies:** Task 4
- **Details:**
  - Test cases:
    - Router has route for path `'/'`
    - Route name is `'home'`
    - Route component is HomePage
    - Router uses web history mode
- **Acceptance Criteria:**
  - All test cases pass
  - Verifies route configuration
- **Effort:** small

---

#### Task 16: Create E2E Test Suite

- [ ] **Create homepage.spec.ts E2E tests**
- **File(s):** `playwright/e2e/homepage.spec.ts`
- **Action:** create
- **Dependencies:** All previous tasks
- **Details:**
  - Use `data-test-id` selectors exclusively — no CSS class or XPath selectors
  - Test flows:
    
    **Flow 1: Homepage loads with all sections**
    1. Navigate to `/`
    2. Wait for `[data-test-id="homepage"]` to be visible
    3. Assert `[data-test-id="hero-section"]` is visible
    4. Assert `[data-test-id="features-section"]` is visible
    5. Assert `[data-test-id="differentiators-section"]` is visible
    6. Assert `[data-test-id="pipeline-section"]` is visible
    7. Assert `[data-test-id="quickstart-section"]` is visible
    8. Assert `[data-test-id="cta-section"]` is visible
    
    **Flow 2: Hero section displays correct content**
    1. Navigate to `/`
    2. Assert `[data-test-id="hero-headline"]` contains "AI-Driven R&D Pipeline"
    3. Assert `[data-test-id="hero-tagline"]` contains "From Idea to Code"
    
    **Flow 3: Feature cards render correctly**
    1. Navigate to `/`
    2. Assert `[data-test-id="feature-card-0"]` through `[data-test-id="feature-card-4"]` are visible
    3. Assert each card contains a title element
    
    **Flow 4: Copy button copies text to clipboard**
    1. Navigate to `/`
    2. Click `[data-test-id="copy-button-0"]`
    3. Assert clipboard contains expected command text (use Playwright's clipboard API)
    
    **Flow 5: CTA buttons are clickable links**
    1. Navigate to `/`
    2. Assert `[data-test-id="cta-get-started"]` has `href` attribute
    3. Assert `[data-test-id="cta-documentation"]` has `href` attribute
    4. Assert `[data-test-id="cta-contribute"]` has `href` attribute
    
    **Flow 6: Responsive layout on mobile viewport**
    1. Set viewport to mobile size (e.g., 375x667)
    2. Navigate to `/`
    3. Assert all sections are visible
    4. Assert pipeline steps are in vertical layout (use visual check or CSS property assertion)
    
- **Acceptance Criteria:**
  - All E2E tests pass
  - Uses `data-test-id` selectors only
  - Tests are isolated and idempotent
  - Includes explicit waits (`waitForSelector`)
  - Tests mobile responsiveness
- **Effort:** medium

---

## 3. File/Module-level Changes

| File Path | Action | Rationale | Golden Reference |
|-----------|--------|-----------|------------------|
| `package.json` | create | Project dependencies and scripts | — |
| `vite.config.ts` | create | Build tool configuration | Vite docs |
| `tsconfig.json` | create | TypeScript configuration | Vue 3 + TS template |
| `index.html` | create | HTML entry point | Vite Vue template |
| `src/frontend/main.ts` | create | Application entry point | Vue 3 + Vuetify docs |
| `src/frontend/App.vue` | create | Root component | `components/example/` (if exists) |
| `src/frontend/router/index.ts` | create | Vue Router configuration | Vue Router docs |
| `src/frontend/views/HomePage.vue` | create | Main page view composing sections | — |
| `src/frontend/components/home/HeroSection.vue` | create | Hero headline and tagline | — |
| `src/frontend/components/home/FeaturesSection.vue` | create | 5 feature cards | — |
| `src/frontend/components/home/DifferentiatorsSection.vue` | create | 4 differentiator cards | — |
| `src/frontend/components/home/PipelineSection.vue` | create | Pipeline stepper visualization | — |
| `src/frontend/components/home/QuickStartSection.vue` | create | Quick start code blocks | — |
| `src/frontend/components/home/CtaSection.vue` | create | Call-to-action buttons | — |
| `tests/frontend/components/home/HeroSection.spec.ts` | create | Unit test | — |
| `tests/frontend/components/home/FeaturesSection.spec.ts` | create | Unit test | — |
| `tests/frontend/components/home/DifferentiatorsSection.spec.ts` | create | Unit test | — |
| `tests/frontend/components/home/PipelineSection.spec.ts` | create | Unit test | — |
| `tests/frontend/components/home/QuickStartSection.spec.ts` | create | Unit test | — |
| `tests/frontend/components/home/CtaSection.spec.ts` | create | Unit test | — |
| `tests/frontend/views/HomePage.spec.ts` | create | Unit test | — |
| `tests/frontend/router/index.spec.ts` | create | Unit test | — |
| `playwright/e2e/homepage.spec.ts` | create | E2E tests | — |

---

## 4. Schema & DTO Changes

**Not applicable.** This is a frontend-only feature with static content. No database interactions or backend DTOs are required.

---

## 5. Test Strategy

### Unit Tests (Jest)

| Test File | What to Test | Mocks Needed | Coverage Target |
|-----------|--------------|--------------|-----------------|
| `HeroSection.spec.ts` | Renders headline and tagline text | None | Content rendering |
| `FeaturesSection.spec.ts` | Renders 5 feature cards with titles | None | Card count, content |
| `DifferentiatorsSection.spec.ts` | Renders 4 differentiator cards | None | Card count, content |
| `PipelineSection.spec.ts` | Renders 6 pipeline steps | None | Step count, labels |
| `QuickStartSection.spec.ts` | Renders 4 steps, copy button works | `navigator.clipboard` | Steps, copy functionality |
| `CtaSection.spec.ts` | Renders 3 CTA buttons with links | None | Button count, href attributes |
| `HomePage.spec.ts` | Composes all 6 sections in order | Child components | Section presence, order |
| `router/index.spec.ts` | Route configuration is correct | None | Routes, history mode |

### Integration Tests

| Scenario | Test Scope |
|----------|------------|
| App renders with router | Mount App with router, verify HomePage renders at `/` |
| All sections visible on load | Mount HomePage, verify all sections render without errors |

### E2E Tests (Playwright)

#### Flow 1: Homepage loads with all sections

1. Navigate to `/`
2. `waitForSelector('[data-test-id="homepage"]')`
3. Assert visibility of all section `data-test-id` values
4. Assert sections are in correct order (top to bottom)

#### Flow 2: Hero section displays correct content

1. Navigate to `/`
2. Assert `[data-test-id="hero-headline"]` text is "AI-Driven R&D Pipeline"
3. Assert `[data-test-id="hero-tagline"]` text contains "From Idea to Code"

#### Flow 3: Feature cards render correctly

1. Navigate to `/`
2. Assert `[data-test-id="feature-card-0"]` through `[data-test-id="feature-card-4"]` are visible
3. Assert each card contains title and description text

#### Flow 4: Copy button copies text to clipboard

1. Navigate to `/`
2. Grant clipboard permissions (Playwright browserContext)
3. Click `[data-test-id="copy-button-0"]`
4. Read clipboard content
5. Assert clipboard contains "git clone"

#### Flow 5: CTA buttons are clickable links

1. Navigate to `/`
2. Assert `[data-test-id="cta-get-started"]` has `href` attribute
3. Assert `[data-test-id="cta-documentation"]` has `href` attribute
4. Assert `[data-test-id="cta-contribute"]` has `href` attribute

#### Flow 6: Responsive layout on mobile viewport

1. Set viewport to 375x667
2. Navigate to `/`
3. Assert all sections are visible
4. Assert layout adapts (no horizontal scroll)

### Required `data-test-id` Values

| Element | `data-test-id` |
|---------|----------------|
| Homepage root | `homepage` |
| Hero section | `hero-section` |
| Hero headline | `hero-headline` |
| Hero tagline | `hero-tagline` |
| Features section | `features-section` |
| Feature cards (5) | `feature-card-0`, `feature-card-1`, `feature-card-2`, `feature-card-3`, `feature-card-4` |
| Differentiators section | `differentiators-section` |
| Differentiator cards (4) | `differentiator-card-0`, `differentiator-card-1`, `differentiator-card-2`, `differentiator-card-3` |
| Pipeline section | `pipeline-section` |
| Pipeline steps (6) | `pipeline-step-0`, `pipeline-step-1`, `pipeline-step-2`, `pipeline-step-3`, `pipeline-step-4`, `pipeline-step-5` |
| QuickStart section | `quickstart-section` |
| QuickStart steps (4) | `quickstart-step-0`, `quickstart-step-1`, `quickstart-step-2`, `quickstart-step-3` |
| Copy buttons (4) | `copy-button-0`, `copy-button-1`, `copy-button-2`, `copy-button-3` |
| CTA section | `cta-section` |
| Get Started button | `cta-get-started` |
| Documentation button | `cta-documentation` |
| Contribute button | `cta-contribute` |

---

## 6. Deployment & Rollout

### Feature Flags

| Flag Name | Default | Purpose |
|-----------|---------|---------|
| _None_ | — | Static content, no feature flags needed |

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| _None_ | — | — | Static content, no env vars needed |

### Migration Steps

1. No database migrations required — frontend-only feature
2. Deploy new frontend assets
3. Update any reverse proxy/CDN rules if needed for SPA routing

### Rollback Plan

1. Revert to previous frontend build
2. No database rollback needed

### Monitoring & Logging

- [ ] No logging required — static content
- [ ] Future consideration: Add page view analytics if needed

---

## 7. AI-Agent Guardrails

⚠️ **Developer agents must read this section before implementing any task.**

| Area | Warning | Correct Pattern |
|------|---------|-----------------|
| **Frontend Framework** | Use Vue 3 `<script setup>` only. **No React, MUI, Tailwind, Bootstrap.** | Vuetify + Composition API |
| **Options API** | Never use `data()`, `methods`, `computed` blocks outside `<script setup>`. | Always `<script setup lang="ts">` |
| **UI Components** | Only use Vuetify components (`v-btn`, `v-card`, `v-container`, etc.). | No raw HTML buttons, no custom CSS frameworks |
| **Imports** | Only import from `vue`, `vuetify`, `vue-router`. | Check package.json first |
| **Types** | No `any` types. Explicit interfaces required. | Define interfaces/types for all data |
| **Tests** | Every new component needs a test. Use `data-test-id` for E2E. | `*.spec.ts` for each component |
| **data-test-id** | Add to **all** interactive elements and major sections. | Buttons, cards, sections, links |
| **State** | No Pinia store needed for this feature (static content). | If dynamic content added later, use Pinia |
| **Styling** | Use `<style scoped>`. Prefer Vuetify utility props over custom CSS. | No global CSS, no Tailwind |
| **Files** | Max 300-400 lines per file. Split if larger. | Single responsibility |
| **DOM** | No direct DOM manipulation (`document.querySelector`, `innerHTML`). | Use Vue refs and Vuetify components |
| **Clipboard** | Use native `navigator.clipboard.writeText()`. | No third-party clipboard libraries |
| **External Links** | Add `rel="noopener noreferrer"` to external links. | Security best practice |
| **Icons** | Use MDI icons from Vuetify (`mdi-*`). | Already bundled with Vuetify |

### Common Mistakes to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Using React patterns (`useState`, JSX) | Use Vue Composition API (`ref`, `computed`) |
| Importing MUI or other UI libs | Only import from `vuetify` |
| Missing `data-test-id` | Add to ALL interactive elements |
| Using Options API | Always `<script setup lang="ts">` |
| Missing tests | Create test file for every new component |
| Hardcoded inline styles | Use Vuetify props and `<style scoped>` |
| Missing `:key` in `v-for` | Always provide stable, unique key |
| Raw fetch in components | Move to composable (if dynamic data added later) |
| Large monolithic components | Split into smaller, focused components |

---

## 8. Definition of Done

### Implementation Complete

- [ ] All tasks in Section 2 marked complete
- [ ] No `TODO` or `FIXME` comments left unresolved
- [ ] All components use `<script setup lang="ts">`
- [ ] All components use only Vuetify components

### Quality Gates

- [ ] All unit tests passing (`npm run test`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Lint passing (`npm run lint`)
- [ ] Type-check passing (`npm run type-check`)
- [ ] No new warnings introduced
- [ ] Page loads in under 3 seconds (product requirement)

### Documentation

- [ ] README updated to reference the welcome page
- [ ] Inline comments for complex logic (copy functionality)

### Review Ready

- [ ] Self-review completed
- [ ] All `data-test-id` values added per Section 5
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Feature tested manually in development
- [ ] External links include `rel="noopener noreferrer"`

---

## Appendix: Task Dependency Graph

```
Task 1 (Project Setup)
    │
    ▼
Task 2 (main.ts)
    │
    ▼
Task 3 (App.vue)
    │
    ▼
Task 4 (Router)
    │
    ├──────────┬──────────┬──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼          ▼
Task 5      Task 6      Task 7     Task 8     Task 9     Task 10
(Hero)    (Features) (Differ.)  (Pipeline) (QuickStart) (CTA)
    │          │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┴──────────┘
                              │
                              ▼
                    Task 11 (HomePage View)
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
Task 12-15 (Unit Tests)                     Task 16 (E2E Tests)
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
                           [Done]
```

**Parallel execution opportunities:**
- Tasks 5-10 (all section components) can be implemented in parallel after Task 4
- Tasks 12-15 (unit tests) can be implemented in parallel after their respective components
- Documentation updates can happen in parallel with testing

---

## Notes

- **First frontend feature:** This creates the initial `src/frontend/` directory structure. Future features will build on this foundation.
- **No Pinia store:** Static content only. If dynamic content (e.g., GitHub repo stats) is added later, create `src/frontend/stores/useHomeStore.ts`.
- **Build tool:** Vite is recommended per tech spec. The project setup task should use Vite 5.x with Vue 3 template.
- **Open questions resolved:** All open questions from tech spec (build tool, hosting, icons, pipeline viz, clipboard) have been decided.
