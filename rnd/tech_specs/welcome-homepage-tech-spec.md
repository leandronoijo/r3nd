# Technical Specification – Welcome Homepage

**Feature ID:** welcome-homepage  
**Product Spec:** `rnd/product_specs/welcome-homepage-product-spec.md`  
**Author:** Architect  
**Date:** 2025-11-30

---

## 1. Context & Existing System

This feature introduces a welcome homepage for the AI-Driven R&D Pipeline seed repository. The page will be built as a Vue 3 component using Vuetify, following the frontend conventions defined in `.github/instructions/frontend.instructions.md`.

The repository is currently a seed/template project without existing application code under `src/`. This feature represents the first frontend implementation and will establish the initial `src/frontend/` directory structure.

### 1.1 Affected Modules

| Module / Path | Purpose | Impact |
|---------------|---------|--------|
| `src/frontend/views/` | Route-level views | New — HomePage.vue will be created |
| `src/frontend/components/` | Reusable UI components | New — Section components will be created |
| `src/frontend/router/` | Vue Router configuration | New — Router setup required |
| `src/frontend/App.vue` | Root application component | New — Entry point |

### 1.2 Related Infrastructure

This feature is frontend-only and does not require backend infrastructure.

- **Database collections/tables affected:** None
- **Environment variables or config changes:** None required for static content
- **External APIs or third-party services:** None

---

## 2. Requirements Mapping

| Product Goal (from Spec) | Technical Requirement |
|--------------------------|----------------------|
| Provide clear, compelling introduction | Create `HomePage.vue` with hero section containing headline and tagline |
| Explain core value proposition (5 features) | Create `FeaturesSection.vue` component with 5 feature cards using Vuetify's `v-card` |
| Highlight differentiators (4 items) | Create `DifferentiatorsSection.vue` component with 4 differentiator cards |
| Show pipeline workflow visually | Create `PipelineSection.vue` component with ASCII/diagram flow visualization |
| Provide Quick Start commands | Create `QuickStartSection.vue` component with code blocks and copy functionality |
| Include call-to-action links | Create `CtaSection.vue` component with three `v-btn` action buttons |
| Responsive design (mobile, tablet, desktop) | Use Vuetify's responsive grid system (`v-container`, `v-row`, `v-col`) with breakpoints |
| Page load under 3 seconds | Static content only; no external API calls; lazy-load non-critical sections if needed |

---

## 3. Proposed Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.vue                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Vue Router                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                  HomePage.vue                       │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  HeroSection.vue                              │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  FeaturesSection.vue                          │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  DifferentiatorsSection.vue                   │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  PipelineSection.vue                          │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  QuickStartSection.vue                        │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  CtaSection.vue                               │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend Design

**Not applicable.** This feature is frontend-only with static content. No backend API endpoints, services, or database interactions are required.

### 3.3 Frontend Design

#### 3.3.1 Components

| Component | Path | Purpose |
|-----------|------|---------|
| `App.vue` | `src/frontend/App.vue` | Root component with Vuetify setup and router-view |
| `HomePage.vue` | `src/frontend/views/HomePage.vue` | Main welcome page view composing all sections |
| `HeroSection.vue` | `src/frontend/components/home/HeroSection.vue` | Headline, tagline, and primary CTA |
| `FeaturesSection.vue` | `src/frontend/components/home/FeaturesSection.vue` | "What This Project Provides" — 5 feature cards |
| `DifferentiatorsSection.vue` | `src/frontend/components/home/DifferentiatorsSection.vue` | "Why Choose This Seed Project" — 4 differentiators |
| `PipelineSection.vue` | `src/frontend/components/home/PipelineSection.vue` | "How the Pipeline Works" — workflow diagram |
| `QuickStartSection.vue` | `src/frontend/components/home/QuickStartSection.vue` | Copy-paste command blocks |
| `CtaSection.vue` | `src/frontend/components/home/CtaSection.vue` | "Get Started", "Documentation", "Contribute" buttons |

#### 3.3.2 Component Specifications

##### HeroSection.vue
- **Content:**
  - Headline: "AI-Driven R&D Pipeline"
  - Tagline: "From Idea to Code — Automated, Traceable, Human-Controlled"
- **Vuetify components:** `v-container`, `v-row`, `v-col`, `v-btn`
- **Responsive:** Full-width container, centered text
- **data-test-id:** `hero-section`, `hero-headline`, `hero-tagline`

##### FeaturesSection.vue
- **Content:** 5 feature cards with icon, title, and description:
  1. Out-of-the-box Personas
  2. End-to-end Multi-stage Workflow
  3. Clear R&D Artifact Structure
  4. Real Application Structure
  5. Repo-wide & Path-specific Copilot Rules
- **Vuetify components:** `v-container`, `v-row`, `v-col`, `v-card`, `v-card-title`, `v-card-text`, `v-icon`
- **Responsive:** Grid layout (1 col mobile, 2-3 cols tablet/desktop)
- **data-test-id:** `features-section`, `feature-card-{index}`

##### DifferentiatorsSection.vue
- **Content:** 4 differentiator cards:
  1. Human-in-the-loop Safety
  2. Deterministic Persona Behavior
  3. Full Traceability
  4. Technology Independence
- **Vuetify components:** `v-container`, `v-row`, `v-col`, `v-card`, `v-icon`
- **Responsive:** Grid layout (1 col mobile, 2 cols tablet, 4 cols desktop)
- **data-test-id:** `differentiators-section`, `differentiator-card-{index}`

##### PipelineSection.vue
- **Content:** Visual pipeline flow showing:
  ```
  GitHub Issue → Product Manager → PR #1 → Architect → PR #2 → Team Lead → PR #3 → Developer → PR #4 → Merged
  ```
- **Vuetify components:** `v-container`, `v-stepper`, `v-stepper-item`, `v-icon`
- **Responsive:** Horizontal on desktop, vertical on mobile (using `v-stepper` with `mobile` prop)
- **data-test-id:** `pipeline-section`, `pipeline-step-{index}`

##### QuickStartSection.vue
- **Content:** 4-step code block with copy functionality:
  1. Clone repository
  2. Customize stack rules
  3. Add application code
  4. Start a feature
- **Vuetify components:** `v-container`, `v-card`, `v-btn` (copy button), `<pre><code>` for code blocks
- **Responsive:** Full-width code blocks
- **data-test-id:** `quickstart-section`, `quickstart-step-{index}`, `copy-button-{index}`

##### CtaSection.vue
- **Content:** 3 call-to-action buttons:
  - "Get Started" → Link to README or docs
  - "View Documentation" → Link to docs/
  - "Contribute" → Link to CONTRIBUTING or GitHub Issues
- **Vuetify components:** `v-container`, `v-row`, `v-col`, `v-btn`
- **Responsive:** Stacked on mobile, horizontal on desktop
- **data-test-id:** `cta-section`, `cta-get-started`, `cta-documentation`, `cta-contribute`

#### 3.3.3 State Management

No Pinia store is required for this feature. All content is static and component-local.

If future requirements introduce dynamic content (e.g., fetching repository stats), a `useHomeStore.ts` could be added following the Pinia setup syntax pattern.

#### 3.3.4 Routing

- **Router file:** `src/frontend/router/index.ts`
- **Routes:**
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

  export default createRouter({
    history: createWebHistory(),
    routes
  });
  ```

### 3.4 Data Flow

For this static page, data flow is minimal:

1. User navigates to root URL (`/`)
2. Vue Router renders `HomePage.vue`
3. `HomePage.vue` renders each section component in sequence
4. Each section component renders its static content using Vuetify components
5. User interacts with CTA buttons → External navigation (same-window or new tab)
6. User clicks copy button in QuickStart → Clipboard API copies command text

---

## 4. Impact Analysis

### 4.1 Behavioral Impact

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| Root URL (`/`) | No frontend exists | Displays welcome homepage |
| Repository structure | No `src/frontend/` | Establishes `src/frontend/` with initial components |

### 4.2 Structural Impact

This feature creates the initial frontend structure:

- **New directory:** `src/frontend/`
- **New directory:** `src/frontend/views/`
- **New directory:** `src/frontend/components/home/`
- **New directory:** `src/frontend/router/`
- **New file:** `src/frontend/App.vue`
- **New file:** `src/frontend/main.ts`
- **New file:** `src/frontend/views/HomePage.vue`
- **New files:** `src/frontend/components/home/*.vue` (6 section components)
- **New file:** `src/frontend/router/index.ts`
- **New config:** `vite.config.ts` or similar build configuration (if not already present)
- **New config:** `package.json` with Vue 3, Vuetify, and Vue Router dependencies

### 4.3 Database Migrations

Not applicable — no database interactions.

---

## 5. Risks & Trade-offs

### 5.1 Backwards Compatibility

- **Breaking changes:** None — this is a new feature in a seed repository without existing frontend
- **Client version requirements:** Modern browsers supporting ES2020+
- **Migration path:** None required

### 5.2 Security Considerations

- **Authentication/authorization:** Not required for public welcome page
- **Input validation:** Not applicable — no user input
- **Sensitive data handling:** None — all content is public static text
- **External links:** Ensure all CTA links open safely (consider `rel="noopener noreferrer"` for external links)

### 5.3 Performance Considerations

- **Expected load:** Low — static marketing page
- **Page load target:** Under 3 seconds (product requirement)
- **Optimization strategies:**
  1. No external API calls — all content is bundled
  2. Lazy-load below-the-fold sections if needed
  3. Optimize images/icons (use Vuetify's MDI icon font)
  4. Enable Vite/Rollup code splitting for future views
- **Caching strategy:** Standard static asset caching via CDN headers

### 5.4 Complexity Trade-offs

| Decision | Alternative | Why Chosen |
|----------|-------------|------------|
| Separate section components | Single monolithic HomePage | Better maintainability, reusability, and testability |
| Static content (no store) | Pinia store for content | Simpler for static page; store can be added later if dynamic content is needed |
| Vuetify grid system | Custom CSS grid | Vuetify provides responsive utilities out-of-the-box per frontend.instructions.md |
| `v-stepper` for pipeline | `v-timeline`, Custom SVG | `v-stepper` is semantically appropriate for step-by-step workflows; `v-timeline` is better for chronological events |

---

## 6. Testing & Observability

### 6.1 Unit Tests

| Component | Test File | Coverage Focus |
|-----------|-----------|----------------|
| `HeroSection.vue` | `tests/frontend/components/home/HeroSection.spec.ts` | Renders headline and tagline correctly |
| `FeaturesSection.vue` | `tests/frontend/components/home/FeaturesSection.spec.ts` | Renders all 5 feature cards |
| `DifferentiatorsSection.vue` | `tests/frontend/components/home/DifferentiatorsSection.spec.ts` | Renders all 4 differentiator cards |
| `PipelineSection.vue` | `tests/frontend/components/home/PipelineSection.spec.ts` | Renders pipeline steps |
| `QuickStartSection.vue` | `tests/frontend/components/home/QuickStartSection.spec.ts` | Renders code blocks, copy button works |
| `CtaSection.vue` | `tests/frontend/components/home/CtaSection.spec.ts` | Renders 3 CTA buttons with correct links |
| `HomePage.vue` | `tests/frontend/views/HomePage.spec.ts` | Composes all sections correctly |

### 6.2 Integration Tests

| Scenario | Test Scope |
|----------|------------|
| HomePage renders all sections | Mount HomePage, verify all section components render |
| Router navigates to home | Vue Router integration with HomePage component |

### 6.3 E2E Tests

| User Flow | Test File |
|-----------|-----------|
| User lands on homepage, sees all content | `playwright/e2e/homepage.spec.ts` |
| User clicks "Get Started" CTA | `playwright/e2e/homepage.spec.ts` |
| User copies Quick Start command | `playwright/e2e/homepage.spec.ts` |
| Responsive layout on mobile viewport | `playwright/e2e/homepage.spec.ts` |

### 6.4 Observability

- **Logging:** Not required for static page (no business logic)
- **Metrics:** Future consideration — page view counts if analytics are added
- **Alerts:** Not applicable for static content

---

## 7. Open Technical Questions

| Question | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| Build tool configuration | Vite, Vue CLI | Vite — modern, fast, Vue 3 default | Open |
| Hosting/deployment approach | GitHub Pages, Vercel, static bundle | Document in README; implementation TBD | Open |
| Icon library for feature cards | Vuetify MDI icons, custom SVGs | MDI icons — already bundled with Vuetify | Resolved |
| Pipeline visualization component | `v-timeline`, `v-stepper`, custom component | `v-stepper` — semantically appropriate for step-by-step workflows | Resolved |
| Copy-to-clipboard implementation | Clipboard API directly, third-party library | Native Clipboard API — modern browsers support | Resolved |

**Note:** The `src/` and `tests/` directories do not currently exist in this seed repository. This feature will establish the initial `src/frontend/` and `tests/frontend/` directory structures as described in Section 1.1.

---

## 8. Implementation Notes

### 8.1 Suggested Task Breakdown

High-level tasks (Team Lead will refine into detailed build plan):

1. **Project setup:** Initialize Vue 3 project with Vite, add Vuetify and Vue Router dependencies
2. **App structure:** Create `App.vue`, `main.ts`, and router configuration
3. **HeroSection:** Implement hero component with headline and tagline
4. **FeaturesSection:** Implement 5 feature cards with responsive grid
5. **DifferentiatorsSection:** Implement 4 differentiator cards
6. **PipelineSection:** Implement pipeline visualization using `v-stepper`
7. **QuickStartSection:** Implement code blocks with copy functionality
8. **CtaSection:** Implement 3 CTA buttons
9. **HomePage:** Compose all sections in the view component
10. **Unit tests:** Add Jest tests for all components
11. **E2E tests:** Add Playwright tests for homepage flows
12. **Documentation:** Update README to reference the welcome page

### 8.2 Dependencies Between Tasks

```
[1. Project setup]
        │
        ▼
[2. App structure]
        │
        ├──────────┬──────────┬──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼          ▼
      [3]        [4]        [5]        [6]        [7]        [8]
   HeroSection Features  Differ.   Pipeline  QuickStart   CTA
        │          │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┴──────────┘
                                    │
                                    ▼
                           [9. HomePage view]
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                   [10. Unit tests]      [11. E2E tests]
                                    │
                                    ▼
                           [12. Documentation]
```

- Tasks 3-8 (section components) can be parallelized after App structure is complete
- HomePage (9) depends on all section components
- Tests (10, 11) depend on components being implemented
- Documentation (12) can be done in parallel with testing

### 8.3 References

- Related product spec: `rnd/product_specs/welcome-homepage-product-spec.md`
- Frontend development rules: `.github/instructions/frontend.instructions.md`
- Repository README: `README.md` (for content alignment)
- Vuetify documentation: https://vuetifyjs.com/

---

## 9. Appendix

### 9.1 Content Reference

Content for each section is defined in the product spec (Section 6.1). Key values:

**Headline:** "AI-Driven R&D Pipeline"  
**Tagline:** "From Idea to Code — Automated, Traceable, Human-Controlled"

**Features (5):**
1. Out-of-the-box Personas — Four Copilot personas with strict roles
2. End-to-end Multi-stage Workflow — Chained pipeline with human-controlled PR gates
3. Clear R&D Artifact Structure — Complete traceability under `rnd/`
4. Real Application Structure — Application code under `src/` and tests under `tests/`
5. Repo-wide & Path-specific Copilot Rules — Stack-specific rules via `.github/instructions`

**Differentiators (4):**
1. Human-in-the-loop Safety — No code merged without human review
2. Deterministic Persona Behavior — Narrow scope, no role spill
3. Full Traceability — Complete chain from Product Spec to Code
4. Technology Independence — No assumed language or framework

### 9.2 Suggested Directory Structure

```
src/
└── frontend/
    ├── App.vue
    ├── main.ts
    ├── components/
    │   └── home/
    │       ├── HeroSection.vue
    │       ├── FeaturesSection.vue
    │       ├── DifferentiatorsSection.vue
    │       ├── PipelineSection.vue
    │       ├── QuickStartSection.vue
    │       └── CtaSection.vue
    ├── views/
    │   └── HomePage.vue
    └── router/
        └── index.ts

tests/
└── frontend/
    ├── components/
    │   └── home/
    │       ├── HeroSection.spec.ts
    │       ├── FeaturesSection.spec.ts
    │       ├── DifferentiatorsSection.spec.ts
    │       ├── PipelineSection.spec.ts
    │       ├── QuickStartSection.spec.ts
    │       └── CtaSection.spec.ts
    └── views/
        └── HomePage.spec.ts

playwright/
└── e2e/
    └── homepage.spec.ts
```

### 9.3 Related Documents

- Product Spec: `rnd/product_specs/welcome-homepage-product-spec.md`
- Frontend Instructions: `.github/instructions/frontend.instructions.md`
- Tech Spec Template: `.github/templates/tech_spec.md`
