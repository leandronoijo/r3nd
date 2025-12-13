````instructions
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
| Framework | Angular 20 | Standalone components only, no NgModules |
| State | RxJS | BehaviorSubjects, Observables, and reactive patterns |
| UI Library | PrimeNG | The **only** allowed component library |
| Build Tool | Angular CLI | Webpack-based builds with Angular optimizations |

**Testing & quality gates:** Follow `.github/instructions/testing.instructions.md`.

### CLI Tooling & Package Management

**Always prefer CLI tools over manual file editing:**
- **Installing packages**: Use `npm install <package>` instead of manually editing `package.json`.
- **Scaffolding**: Use Angular CLI commands (`ng new`, `ng generate`) instead of manually creating project structure.
- **Component generation**: Use `ng generate component`, `ng generate service`, etc. for scaffolding.
- **Dev server proxy**: For local development, add a `proxy.conf.json` to forward `/api` to your backend (e.g., `http://localhost:3000`) and run `ng serve --proxy-config proxy.conf.json` so same-origin requests reach the backend without runtime injection.

**Why**: CLI tools ensure correct configuration, update lockfiles automatically, and follow framework best practices.

### Forbidden

- React, Vue, MUI, Bootstrap, Tailwind, or any other UI framework.
- NgModules (use standalone components only).
- Direct DOM manipulation (`document.querySelector`, `innerHTML`, etc.).
- Inline styles unless minimal and component-scoped.
- Global CSS not scoped to a component.
- Class-based services without `@Injectable()` decorator.

---

## File & Folder Conventions

```
src/frontend/
├── app/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route-level page components
│   ├── services/     # Injectable services for state/API
│   ├── guards/       # Route guards
│   ├── interceptors/ # HTTP interceptors
│   └── app.component.ts
├── assets/           # Static assets
└── main.ts           # Bootstrap entry
```

- One component per file.
- Filename matches component name in kebab-case (e.g., `user-card.component.ts`).
- Services use kebab-case (e.g., `user-state.service.ts`).
- Use `.component.ts`, `.service.ts`, `.guard.ts` suffixes.

---

## Component Rules

1. **Always use standalone components** — set `standalone: true` in `@Component()` decorator.
2. **Imports** — explicitly import all dependencies in `imports: []` array (CommonModule, PrimeNG modules, etc.).
3. **Inputs** — use `@Input()` decorator with explicit types.
4. **Outputs** — use `@Output()` decorator with `EventEmitter<T>`.
5. **Reactivity** — use RxJS Observables, `async` pipe in templates, avoid manual subscriptions when possible.
6. **Side effects** — use lifecycle hooks (`ngOnInit`, `ngOnDestroy`); always unsubscribe from manual subscriptions.
7. **Data fetching** — always via services, never inline HTTP calls in components.

### Template rules

- Add `data-test-id` attributes to **all interactive elements** (buttons, inputs, links, dialogs).
- Prefer PrimeNG components (`p-button`, `p-inputText`, `p-card`, etc.) over raw HTML.
- Use `trackBy` functions on all `*ngFor` directives; trackBy must return stable, unique identifiers.
- Avoid deeply nested ternaries in templates; extract to component properties or methods.
- Use `async` pipe for Observable subscriptions in templates to avoid memory leaks.

---

## Service & State Management Rules

1. **All services must be `@Injectable({ providedIn: 'root' })`** for singleton pattern.
2. **State management pattern**:
   - Use `BehaviorSubject<T>` for mutable state.
   - Expose state as `Observable<T>` (read-only) via `.asObservable()`.
   - Provide methods to update state (not direct subject access).
3. **HTTP calls**:
   - Use Angular's `HttpClient` service.
   - All HTTP logic belongs in **services**, not components.
   - Use RxJS operators (`map`, `catchError`, `tap`) for transformations.
4. **Error handling**:
   - Always use `catchError` operator on HTTP calls.
   - Propagate errors to components via error state in BehaviorSubject.
5. **Never expose BehaviorSubject directly** — always use `.asObservable()`.

### Example State Service Pattern

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  setUser(user: User): void {
    this.userSubject.next(user);
  }

  clearUser(): void {
    this.userSubject.next(null);
  }
}
```

---

## Runtime Environment Configuration

**Build-time vs Runtime Environment Variables:**

- **Build-time** (Angular `environment.ts`): Embedded in the build output at compile time. Cannot change without rebuilding.
- **Runtime** (injected globals): Set after build, allows configuration changes without rebuilds.

**Pattern for Runtime Configuration:**

1. **Server injection**: Custom server (e.g., `server.js`) reads `process.env` and injects into HTML:
   ```javascript
   const apiBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
   // Inject both names so clients using either convention will pick it up
   const html = originalHtml.replace('</head>', 
      `<script>window.__API_BASE_URL__="${apiBase}";window.__VITE_API_BASE_URL__="${apiBase}";</script></head>`);
   ```

2. **Client consumption**: Service reads runtime global with fallbacks:
   ```typescript
   // Support both common runtime injection names
   const apiBase = (globalThis as any).__API_BASE_URL__ || (globalThis as any).__VITE_API_BASE_URL__ || '/api';
   ```

3. **Treat empty strings as undefined**: Use `|| undefined` to ensure fallback chain works:
   ```typescript
   const runtimeVar = ((globalThis as any).__VAR__) || undefined;
   const final = runtimeVar ?? defaultValue;
   ```

**Docker/Container Pattern:**
- Set env vars as both build `args` and runtime `environment` in docker-compose.
- For browser access from host: use `http://localhost:<port>` not internal service names.
- Custom server must be included in runtime image and expose env as runtime ENV.

---

## Styling Rules

- Use component-scoped styles (`:host`, `:host-context`).
- Prefer PrimeNG component props and CSS variables over custom CSS.
- No Tailwind, no global utility classes.
- If custom CSS is needed, keep selectors shallow (max 2 levels).
- Use Angular's `ViewEncapsulation.Emulated` (default) for style isolation.

---

## Common AI-Agent Mistakes to Avoid

| Mistake | Mitigation |
|---------|------------|
| Using React/Vue patterns (`useState`, `v-model`) | Always use Angular patterns: `@Input()`, `@Output()`, RxJS. |
| Importing MUI or other UI libs | Only import from `primeng/*` and Angular core. |
| Forgetting `data-test-id` | Add to every clickable/inputable element. |
| Inline HTTP in component | Move to service with RxJS Observables. |
| Large monolithic components | Split into smaller, single-responsibility components. |
| Skipping tests | Every new component/service requires a test file. |
| Using NgModules | Always use `standalone: true`. |
| Hardcoding strings | Use constants or i18n keys if applicable. |
| Missing `trackBy` in `*ngFor` | Always provide a trackBy function. |
| Manual subscriptions without cleanup | Use `async` pipe or unsubscribe in `ngOnDestroy`. |
| Forgetting to import CommonModule | Standalone components must explicitly import CommonModule for `*ngIf`, `*ngFor`, etc. |

````