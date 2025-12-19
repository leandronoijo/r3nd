function buildOverviewPrompt(repoRoot = '.') {
  return `You are an assistant that inspects a repository and produces a project-level instructions file.

Produce a markdown document that contains a machine-readable JSON code block with a top-level key "apps" listing each app/service. Each app entry must use the following keys (camelCase):
- name: short canonical name for the app (used as filename)
- applyTo: path or glob that the instructions apply to (use repo-relative paths)
- purpose: short purpose/summary
- stack: short tech stack hints

Also include human-readable sections: Project Overview (what are the apps/services and where they live), Repo-level instructions (global conventions/shared tooling), and Out-of-scope sections.

Output format requirements:
- Include a JSON fenced block labeled as \`\`\`json containing: {"apps": [ {"name":"...","applyTo":"path/to/app","purpose":"...","stack":"..."}, ... ]}
- After the JSON block, include the human-readable sections.

Please keep the JSON block concise and valid JSON so it can be parsed programmatically.
`;
}

function buildAppPrompt(appInfo = {}) {
  const name = appInfo.name || 'UNKNOWN_APP';
  const path = appInfo.path || './';
  return `You are an assistant that writes detailed instructions for a single app in this repository.

Produce a markdown file titled with the app name and include a top metadata block (YAML or JSON fenced block) that contains at minimum these camelCase fields:
- name: the canonical app name (matches the value used in the project-level apps list)
- applyTo: the path or glob the instructions apply to (repo-relative)

For example, begin the file with a YAML or JSON block like:
\`\`\`yaml
name: ${name}
applyTo: ${path}
\`\`\`

Answer the following sections in detail:
- Tech stack (framework, language, major libs, runtime versions)
- Architecture pattern and key layers (controllers/services/repos), strict boundaries
- Must-follow conventions (naming, file layout, module boundaries)
- Forbidden patterns or anti-patterns
- Tooling for dependency management and scripts
- Key commands for dev, build, test, lint, format
- Config approach (env vars, config files, secrets management)
- External services (DB, cache, queues, APIs)
- Deployment/runtime expectations (docker, ports, health checks)

If Docker or compose files exist for this app, include an Infrastructure section describing Dockerfile/compose locations, base images, required service containers, ports, health checks, and security constraints.

Also include Testing & Quality section: tests present (unit/integration/e2e), locations, and mandatory quality gates (lint/typecheck/coverage thresholds).

Format the document to follow existing instruction file patterns used in this repo (title, applyTo, stack & constraints table, tooling, forbidden, file conventions, testing rules, common mistakes, golden reference).
`;
}

module.exports = { buildOverviewPrompt, buildAppPrompt };
