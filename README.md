# AI-Driven R&D Pipeline – Seed Repository

This repository is a `starter template` for teams who want to automate their product → architecture → planning → development lifecycle using **GitHub Copilot Agents** and **GitHub Actions**.

It provides:

- A fully structured, opinionated directory layout  
- Four Copilot personas (Product Manager, Architect, Team Lead, Developer)  
- A chained workflow pipeline producing product specs → tech specs → build plans → code  
- Human-controlled PR gates at every stage  
- Strict separation between R&D artifacts, documentation, and actual application code  

This repo serves as a `seed`: clone it, customize it, and apply your own technology stack through the `.github/instructions` files.

---

## 🚀 What This Repo Provides

### 1. Out-of-the-box personas
Located in `.github/agents/`:

- `product-manager.agent.md`
- `architect.agent.md`
- `team-lead.agent.md`
- `developer.agent.md`

Each persona has a strict role and writes only to their designated output paths.

### 2. End-to-end multi-stage workflow
Located in `.github/workflows/`:

1. 01-product-spec → Generates Product Spec  
2. 02-tech-spec → Generates Technical Spec  
3. 03-build-plan → Generates Implementation Plan  
4. 04-development → Generates application code + tests  

Each stage opens a PR.  
A human must approve before the next stage runs.

### 3. Clear R&D artifact structure
Located under `rnd/`:

- `product_specs/`
- `tech_specs/`
- `build_plans/`
- `history/`

This ensures complete traceability from idea → architecture → plan → code.

### 4. Real application structure
Located under:

- `src/` → application code  
- `tests/` → project tests  

The Developer persona modifies only these directories.

### 5. Repo-wide & path-specific Copilot rules
- `.github/copilot-instructions.md`  
- `.github/instructions/*.instructions.md`  

This is where you define stack-specific rules (Node.js, Python, Go, AWS, React, etc.) without touching personas.

---

## 📦 How the Pipeline Works

GitHub Issue  
→ 01-product-spec (Product Manager)  
→ PR #1 (human review)  
→ 02-tech-spec (Architect)  
→ PR #2 (human review)  
→ 03-build-plan (Team Lead)  
→ PR #3 (human review)  
→ 04-development (Developer)  
→ PR #4 (human review)  
→ Code merged

Every stage consumes the previous artifact and produces the next.  
No stage runs automatically without human approval.

---

## 🧱 How to Use This Seed Repo

### 1. Clone this repository
git clone <this-seed-repo-url>

### 2. Customize your stack rules
Update files under:

- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`

Here you define:

- Coding standards  
- Tech stack and libraries  
- Architectural patterns  
- Testing conventions  
- Folder-specific behaviors  

### 3. Install your real application code
Place your service, project, or monorepo under:

src/  
tests/

### 4. Start a feature
Create a GitHub Issue describing a new feature in 1–2 paragraphs.  
This automatically triggers the Product Manager workflow.

### 5. Review each PR

- Product Spec → human review  
- Tech Spec → human review  
- Build Plan → human review  
- Developer Code → human review  

After merging Developer’s PR, your feature is fully implemented.

---

## 🛡 Principles & Guarantees

This template enforces:

### ✔ Human-in-the-loop safety
No code is merged without human review.

### ✔ Deterministic persona behavior
Each persona has a narrow scope and cannot spill into other roles.

### ✔ Traceability
Each feature produces a full chain of artifacts:  
Product Spec → Tech Spec → Build Plan → Code.

### ✔ Technology independence
The template does not assume any specific language or framework.  
All tech constraints live in your `.github/instructions` files.

---

## 📁 Repo Structure

.github/
	&nbsp;&nbsp;workflows/
	&nbsp;&nbsp;&nbsp;&nbsp;common/
	&nbsp;&nbsp;templates/
	&nbsp;&nbsp;agents/
	&nbsp;&nbsp;instructions/
	&nbsp;&nbsp;copilot-instructions.md
rnd/  
&nbsp;&nbsp;product_specs/  
&nbsp;&nbsp;tech_specs/  
&nbsp;&nbsp;build_plans/  
&nbsp;&nbsp;history/  
src/  
tests/  
docs/

---

## 📘 Documentation

See the `docs/` directory for optional project documentation that explains the pipeline, personas, and automation architecture — this folder is intentionally extensible and may be empty in the seed repository.

---

## 👤 For Maintainers

To extend or adapt the system:

- Add new personas under `.github/agents`
- Add new workflow stages under `.github/workflows`
- Expand repo instructions for new stacks
- Use `.github/instructions/*.instructions.md` to enforce path-level rules
- Add architecture notes or diagrams under `docs/`

---

## 🐳 Docker Quick Start

Run the entire stack (backend + frontend + MongoDB) with Docker Compose:

```bash
docker-compose -f src/docker-compose.yml up --build
```

Services will be available at:
- **Frontend**: http://localhost:4173
- **Backend API**: http://localhost:3000/api
- **MongoDB**: localhost:27017

To stop the services:

```bash
docker-compose -f src/docker-compose.yml down
```

To stop and remove volumes:

```bash
docker-compose -f src/docker-compose.yml down -v
```

### Environment Variables

| Service | Variable | Default | Purpose |
|---------|----------|---------|---------|
| backend | `PORT` | `3000` | HTTP port |
| backend | `MONGODB_URI` | `mongodb://mongo:27017/r3nd` | Database connection |
| frontend | `VITE_API_BASE_URL` | `http://localhost:3000/api` | Backend API URL (for browser) |

---

## 🧭 Roadmap

Potential future enhancements:

- Automated diff validation (AI allowed to edit only approved files)
- Multi-agent critique loops for higher-quality specs
- Auto-link specs and build plans to PR descriptions
- Diagram generation from tech specs
- Optional CI for running tests after the Developer stage
