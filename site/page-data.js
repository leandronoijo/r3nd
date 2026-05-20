window.PAGE_MODEL = {
  nav: {
    brand: "r3nd",
    actions: [
      { label: "Get Started", variant: "primary", href: "https://github.com/leandronoijo/r3nd/blob/develop/docs/getting-started.md" },
      { label: "View in GitHub", variant: "secondary", href: "https://github.com/leandronoijo/r3nd" }
    ]
  },

  hero: {
    eyebrow: "SPEC-DRIVEN SDLC FRAMEWORK",
    titlePrefix: "Spec-driven software delivery ",
    titleAccent: "with AI agents",
    description: "Turn product requests into specs, plans, code, tests, and retros with a repo-native workflow that works across Codex, Gemini, Copilot, Cursor, or prompts - while humans stay in control.",
    actions: [
      { variant: "primary", label: "See workflows", icon: "arrow_forward", href: "#workflow-modes" },
      { variant: "secondary", label: "Get started", href: "#get-started" }
    ],
    features: [
      { icon: "terminal", label: "Tool-agnostic execution" },
      { icon: "security", label: "Human approval gates" },
      { icon: "history_edu", label: "Repo-native artifacts" }
    ],
    terminalLabel: "r3nd :: active_pipeline",
    workflowNodes: [
      {
        state: "complete",
        icon: "description",
        title: "Product Spec",
        progress: "100%",
        status: "check"
      },
      {
        state: "pending",
        icon: "architecture",
        title: "Technical Design",
        progress: "75%",
        status: "pending"
      },
      {
        state: "locked",
        icon: "code",
        title: "Execution",
        progress: "0%",
        status: "lock"
      }
    ],
    gate: {
      title: "Human Approval Gate",
      subtitle: "Awaiting Lead Architect..."
    }
  },

  workflowPreview: {
    eyebrow: "WORKFLOW MODES",
    titleLine1: "Choose the control level",
    titleLine2: "for the work",
    description: "From architectural work to tiny fixes, r3nd gives teams different delivery paths with explicit approval points and durable repo artifacts.",
    activeMode: "fullControl",
    modes: [
      {
        key: "fullControl",
        icon: "rocket_launch",
        title: "Full Control",
        description: "Large features requiring deep review cycles."
      },
      {
        key: "semiControl",
        icon: "account_tree",
        title: "Semi-Control",
        description: "Iterative updates with key gate checks."
      },
      {
        key: "smallFeature",
        icon: "bolt",
        title: "Small Feature",
        description: "Quick additive tasks with validation."
      },
      {
        key: "bugfix",
        icon: "bug_report",
        title: "Bugfix",
        description: "Swift resolution for reported issues."
      }
    ],
    workflows: {
      fullControl: {
        sequence: {
          title: "Full Control Sequence",
          legendAgent: "Agent",
          legendGate: "Human Gate",
          steps: [
            { label: "Request", shortLabel: "Req", type: "neutral", badge: "1" },
            { label: "Product Spec", shortLabel: "Prod\nSpec", type: "agent", badgeIcon: "auto_awesome" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "Tech Spec", shortLabel: "Tech\nSpec", type: "agent", badgeIcon: "architecture" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "Build Plans", shortLabel: "Build\nPlans", type: "agent", badgeIcon: "checklist" },
            { label: "Approval", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "Code", shortLabel: "Code", type: "agent", badgeIcon: "code" },
            { label: "Approval", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "QA", shortLabel: "QA", type: "agent", badgeIcon: "fact_check" },
            { label: "Approval", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" }
          ],
          tail: "End-to-end sequence with explicit approval gates"
        },
        detailCards: [
          {
            icon: "info",
            iconClass: "text-primary",
            title: "Configuration Details",
            rows: [
              { label: "Best for", value: "New feature architecture" },
              { label: "Human role", value: "Reviewer & Strategist" },
              { label: "Agent role", value: "Spec Writer & Implementer" }
            ]
          },
          {
            icon: "analytics",
            iconClass: "text-secondary",
            title: "Artifacts & Tradeoffs",
            rows: [
              { label: "Main artifacts", value: "PR, Tech Spec, MD Files" },
              { label: "Tradeoff", value: "Slower but high-rigor" },
              { label: "Verification", value: "100% human-verified" }
            ]
          }
        ]
      },
      semiControl: {
        sequence: {
          title: "Semi-Control Sequence",
          legendAgent: "Agent",
          legendGate: "Human Gate",
          steps: [
            { label: "Request", shortLabel: "Req", type: "neutral", badge: "1" },
            { label: "Tech Spec", shortLabel: "Tech\nSpec", type: "agent", badgeIcon: "architecture" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "Impl. Feature", shortLabel: "Impl.\nFeat", type: "agent", badgeIcon: "rocket_launch" },
            { label: "Build Plans", shortLabel: "Build\nPlans", type: "agent", badgeIcon: "checklist" },
            { label: "Test Cases", shortLabel: "Test\nCases", type: "agent", badgeIcon: "checklist_rtl" },
            { label: "Code", shortLabel: "Code", type: "agent", badgeIcon: "code" },
            { label: "QA", shortLabel: "QA", type: "agent", badgeIcon: "fact_check" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" }
          ],
          tail: "Balanced speed with one primary human gate"
        },
        detailCards: [
          {
            icon: "info",
            iconClass: "text-primary",
            title: "Configuration Details",
            rows: [
              { label: "Best for", value: "Iterative enhancements" },
              { label: "Human role", value: "Checkpoint reviewer" },
              { label: "Agent role", value: "Planner + Implementer" }
            ]
          },
          {
            icon: "analytics",
            iconClass: "text-secondary",
            title: "Artifacts & Tradeoffs",
            rows: [
              { label: "Main artifacts", value: "Spec updates, PR, QA logs" },
              { label: "Tradeoff", value: "Lower rigor than full-control" },
              { label: "Verification", value: "Human at key gate" }
            ]
          }
        ]
      },
      smallFeature: {
        sequence: {
          title: "Small Feature Sequence",
          legendAgent: "Agent",
          legendGate: "Human Gate",
          steps: [
            { label: "Request", shortLabel: "Req", type: "neutral", badge: "1" },
            { label: "Build Plan", shortLabel: "Build\nPlan", type: "agent", badgeIcon: "checklist" },
            { label: "Human Approval", shortLabel: "Human\nAppr", type: "gate", badgeIcon: "verified_user" },
            { label: "Test Cases", shortLabel: "Test\nCases", type: "agent", badgeIcon: "checklist_rtl" },
            { label: "Code", shortLabel: "Code", type: "agent", badgeIcon: "code" },
            { label: "QA", shortLabel: "QA", type: "agent", badgeIcon: "fact_check" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" }
          ],
          tail: "Lean path for additive feature delivery"
        },
        detailCards: [
          {
            icon: "info",
            iconClass: "text-primary",
            title: "Configuration Details",
            rows: [
              { label: "Best for", value: "Small additive scope" },
              { label: "Human role", value: "Final acceptance" },
              { label: "Agent role", value: "Fast end-to-end execution" }
            ]
          },
          {
            icon: "analytics",
            iconClass: "text-secondary",
            title: "Artifacts & Tradeoffs",
            rows: [
              { label: "Main artifacts", value: "PR + concise QA evidence" },
              { label: "Tradeoff", value: "Less architectural ceremony" },
              { label: "Verification", value: "Final human sign-off" }
            ]
          }
        ]
      },
      bugfix: {
        sequence: {
          title: "Bugfix Sequence",
          legendAgent: "Agent",
          legendGate: "Human Gate",
          steps: [
            { label: "Request", shortLabel: "Req", type: "neutral", badge: "1" },
            { label: "QA", shortLabel: "QA", type: "agent", badgeIcon: "fact_check" },
            { label: "Investigate", shortLabel: "Investig", type: "agent", badgeIcon: "search" },
            { label: "Fix Plan", shortLabel: "Fix\nPlan", type: "agent", badgeIcon: "checklist" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" },
            { label: "Code", shortLabel: "Code", type: "agent", badgeIcon: "code" },
            { label: "QA", shortLabel: "QA", type: "agent", badgeIcon: "fact_check" },
            { label: "Human Review", shortLabel: "Human\nReview", type: "gate", badgeIcon: "verified_user" }
          ],
          tail: "Shortest path to validated production fix"
        },
        detailCards: [
          {
            icon: "info",
            iconClass: "text-primary",
            title: "Configuration Details",
            rows: [
              { label: "Best for", value: "Regression and incident fixes" },
              { label: "Human role", value: "Risk validator" },
              { label: "Agent role", value: "Repro + fix + retest" }
            ]
          },
          {
            icon: "analytics",
            iconClass: "text-secondary",
            title: "Artifacts & Tradeoffs",
            rows: [
              { label: "Main artifacts", value: "Issue link, patch PR, QA proof" },
              { label: "Tradeoff", value: "Fix fast, then widen scope." },
              { label: "Verification", value: "Final human safety check" }
            ]
          }
        ]
      }
    }
  },

  whyItWorks: {
    eyebrow: "WHY IT WORKS",
    titlePrefix: "From vibe-coding to ",
    titleAccent: "controlled delivery",
    description: "r3nd keeps skills, templates, artifacts, approvals, and stack rules in the repository so teams can move fast without becoming opaque.",
    durableTitle: "Durable knowledge.",
    durableDescription: "Specs, plans, QA evidence, context files, and retros stay in the repository instead of disappearing into assistant sessions.",
    executionTitle: "Controlled execution.",
    executionDescription: "Humans review the important decisions at approval gates while agents execute the work between them.",
    toolTitle: "Tool independence.",
    toolDescription: "The same operating model works across Codex, Gemini, Copilot, Cursor, or prompts because the workflow lives in the repo, not in the vendor.",
    toolBadges: [
      { icon: "terminal", iconClass: "text-primary", label: "CODEX" },
      { icon: "flare", iconClass: "text-secondary", label: "GEMINI" },
      { icon: "potted_plant", iconClass: "text-tertiary", label: "CLAUDE" },
      { icon: "code", iconClass: "text-on-surface", label: "CURSOR" },
      { icon: "assistant", iconClass: "text-primary", label: "GITHUB COPILOT" },
      { icon: "flight_takeoff", iconClass: "text-secondary", label: "ANTIGRAVITY" }
    ],
    supportCards: [
      {
        icon: "hub",
        iconClass: "text-primary",
        eyebrow: "Contextual",
        title: "Scoped context.",
        description: "Rules and guidance can exist at the repo, app, or module level so work stays aligned with the part of the system being changed.",
        trail: ["Repo", "App", "Module"],
        trailActiveIndex: 2
      },
      {
        icon: "layers",
        iconClass: "text-secondary",
        eyebrow: "Overlay",
        title: "Stack overlays.",
        description: "Teams can inject stack-specific rules, artifact templates, skills, and workflows without changing the core operating model."
      },
      {
        icon: "split_scene",
        iconClass: "text-tertiary",
        eyebrow: "Parallel",
        title: "Parallel work.",
        description: "Because context is written down and worktrees keep efforts isolated, multiple streams of work can move in parallel without collision."
      }
    ]
  },

  getStarted: {
    eyebrow: "GET STARTED",
    titleLine1: "Install once.",
    titleLine2: "Choose your path.",
    description: "Set up r3nd from the CLI, then pick the setup mode that matches your repository stage.",
    fullGuideLabel: "Open full getting-started.md",
    fullGuideHref: "https://github.com/leandronoijo/r3nd/blob/develop/docs/getting-started.md",
    install: {
      title: "Install The CLI",
      description: "After a global install, use `r3nd` directly from your shell.",
      commands: [
        {
          label: "Global install from GitHub",
          command: "npm install -g git+https://github.com/leandronoijo/r3nd.git#0.3"
        },
        {
          label: "Local development install",
          command: "cd cli\nnpm install"
        }
      ]
    },
    setup: {
      title: "Choose `init` Or `scaffold`",
      description: "The CLI supports two setup paths based on whether you are onboarding an existing repo or creating a new one.",
      paths: [
        {
          name: "`r3nd init`",
          summary: "Use `init` to add the framework to an existing repository with the smallest seed footprint.",
          behaviors: [
            "copies common files, task skills, agent personas, templates, and base build plans",
            "applies selected overlays",
            "writes configuration to `r3nd.yaml`"
          ],
          commands: [
            { label: "Command", command: "r3nd init" },
            { label: "Non-interactive mode", command: "r3nd init -y" }
          ]
        },
        {
          name: "`r3nd scaffold`",
          summary: "Use `scaffold` when starting a new project and you want the fuller bootstrap path.",
          behaviors: [
            "copies the same core seed content as `init`",
            "also copies testing instructions",
            "applies selected overlays",
            "can optionally run scaffold build plans through a supported agent backend"
          ],
          commands: [
            { label: "Command", command: "r3nd scaffold" },
            { label: "Non-interactive mode", command: "r3nd scaffold -y" }
          ]
        }
      ]
    }
  },

  dashboard: {
    eyebrow: "Autonomous Workflows",
    titleLine1: "Execution you can",
    titleLine2: "actually inspect.",
    description: "r3nd can run multi-phase delivery workflows end to end - with explicit phases, hard gates, durable artifacts, QA evidence, and human checkpoints where they actually matter.",
    note: "Agent-run does not mean black-box. Every run stays reviewable.",
    activeTab: "implementFeature",
    tabs: [
      { key: "quickFeature", label: "Quick Feature" },
      { key: "implementFeature", label: "Implement Feature" },
      { key: "bugfix", label: "Bugfix" }
    ],
    workflows: {
      quickFeature: {
        summary: "Best for low-risk additive changes where scope is clear and dependencies are minimal.",
        prompt: "\"Add an export-to-CSV action in the billing usage table and include tenant + date filters.\"",
        checkpoints: [
          { icon: "verified", iconClass: "text-secondary", fill: true, label: "Quick Scope Confirmation" },
          { icon: "fact_check", iconClass: "text-tertiary", fill: false, label: "Final QA Spot Check" }
        ],
        outcome: "Success: Quick_Feature_v1",
        phases: [
          { eyebrow: "Phase 01", title: "Read Requirement", description: "Read and lock the exact feature requirement.", icon: "description", type: "phase" },
          { eyebrow: "Phase 02", title: "Resolve Context", description: "Collect the relevant codebase context and constraints.", icon: "smart_toy", type: "phase" },
          { eyebrow: "Phase 03", title: "Quick Feature Rules Gate", description: "Check quick-feature limitation rules before proceeding.", icon: "security", type: "gate" },
          { eyebrow: "Phase 04", title: "Single Build Plan", description: "Write one build plan with its own FRs and NFRs.", icon: "checklist", type: "phase" },
          { eyebrow: "Phase 05", title: "Test Cases Document", description: "Write the test-cases document for the plan.", icon: "fact_check", type: "phase" },
          { eyebrow: "Phase 06", title: "Code Build Plan", description: "Implement the build plan in code.", icon: "code", type: "phase" },
          { eyebrow: "Phase 07", title: "Run Tests", description: "Run the tests and verify they pass.", icon: "check_circle", type: "phase" },
          { eyebrow: "Phase 08", title: "QA with Human Tools", description: "Run QA using human tools on the implemented feature.", icon: "security", type: "gate" }
        ]
      },
      implementFeature: {
        summary: "Best for larger features with dependency ordering and QA gates. Handles complex multi-file architectural shifts with orchestrated verification steps.",
        prompt: "\"Extend the billing service to support tiered consumption-based pricing with a 30-day grace period.\"",
        checkpoints: [
          { icon: "verified", iconClass: "text-secondary", fill: true, label: "Architectural Review" },
          { icon: "fact_check", iconClass: "text-tertiary", fill: false, label: "Final Live QA Approval" }
        ],
        outcome: "Success: Tiered_Billing_v1",
        phases: [
          { eyebrow: "Phase 01", title: "Read Tech Spec", description: "Read the received tech spec; fail the workflow if none exists.", icon: "description", type: "phase" },
          { eyebrow: "Phase 02", title: "Resolve Context", description: "Collect all relevant instructions from applicable directories.", icon: "smart_toy", type: "phase" },
          { eyebrow: "Phase 03", title: "Build Plan Assurance", description: "Find build plans, or create them when they are missing.", icon: "checklist", type: "phase" },
          { eyebrow: "Phase 04", title: "Write Test Cases", description: "Define the test cases needed for this feature.", icon: "fact_check", type: "phase" },
          { eyebrow: "Phase 05", title: "Execution Plan", description: "Create a todo that includes all build plans and QA gates.", icon: "task", type: "phase" },
          { eyebrow: "Phase 06", title: "Implement Build Plans", description: "Implement each plan with tests and ensure all tests pass.", icon: "code", type: "phase" },
          { eyebrow: "Phase 07", title: "QA Check (Human Tools)", description: "Run QA with human tools according to the defined test cases.", icon: "security", type: "gate" },
          { eyebrow: "Phase 08", title: "Fix Loop", description: "Loop through issues whenever QA rejects the result.", icon: "sync", type: "loop" }
        ]
      },
      bugfix: {
        summary: "Best for production defects that require fast reproduction, contained fixes, and explicit safety checks.",
        prompt: "\"Fix duplicate invoice charge generation when retry jobs run concurrently after payment provider timeout.\"",
        checkpoints: [
          { icon: "verified", iconClass: "text-secondary", fill: true, label: "Fix Plan Review" },
          { icon: "fact_check", iconClass: "text-tertiary", fill: false, label: "Post-fix QA Approval" }
        ],
        outcome: "Success: Billing_Bugfix_v1",
        phases: [
          { eyebrow: "Phase 01", title: "Read Bug Description", description: "Read and lock the reported bug behavior and expected outcome.", icon: "description", type: "phase" },
          { eyebrow: "Phase 02", title: "Resolve Context", description: "Load the relevant code, logs, and runtime context.", icon: "smart_toy", type: "phase" },
          { eyebrow: "Phase 03", title: "Reproduce", description: "Reproduce the issue with stable and repeatable steps.", icon: "science", type: "phase" },
          { eyebrow: "Phase 04", title: "Investigate Source", description: "Trace the source of failure and isolate root cause.", icon: "search", type: "phase" },
          { eyebrow: "Phase 05", title: "Ask for Fix Plan Approval", description: "Present the fix plan and wait for human approval.", icon: "security", type: "gate" },
          { eyebrow: "Phase 06", title: "Apply Fix", description: "Implement the approved fix with targeted scope.", icon: "code", type: "phase" },
          { eyebrow: "Phase 07", title: "Reproduce Again", description: "Run reproduction again to confirm the bug no longer occurs.", icon: "check_circle", type: "phase" }
        ]
      }
    },
    proofCards: [
      {
        icon: "history_edu",
        iconClass: "text-secondary",
        title: "Durable artifacts",
        description: "Full state snapshots at every stage. Audit-ready logs that never expire."
      },
      {
        icon: "door_front",
        iconClass: "text-primary",
        title: "Hard gates",
        description: "Automated blockers that prevent progress until specific quality metrics are hit."
      },
      {
        icon: "rocket_launch",
        iconClass: "text-tertiary",
        title: "Agent-run live QA",
        description: "Real-time dynamic testing by agents on ephemeral branch environments."
      },
      {
        icon: "person_search",
        iconClass: "text-on-primary-fixed",
        title: "Human review",
        description: "High-level oversight designed for critical decision points only."
      }
    ]
  },

  closing: {
    titleLine1: "AI writes the artifact.",
    titleLine2: "Humans review the decision.",
    description: "The team reviews specs, plans, and evidence - not lost chat history.",
    actions: [
      { label: "Start Building with r3nd", variant: "primaryLarge", href: "https://github.com/leandronoijo/r3nd/blob/develop/docs/getting-started.md" },
      { label: "In-Depth Reading", variant: "secondaryLarge", href: "https://github.com/leandronoijo/r3nd/blob/develop/docs/concepts.md" }
    ]
  },

  finalCta: {
    title: "Ready to evolve your delivery pipeline?",
    actions: [
      { label: "Get Started Now", variant: "primary", href: "https://github.com/leandronoijo/r3nd/blob/develop/docs/getting-started.md" },
      { label: "Book a Demo", variant: "secondary", href: "https://github.com/leandronoijo/r3nd/issues/new" }
    ]
  },

  footer: {
    brand: "r3nd",
    copyright: "© 2024 r3nd Framework.",
    links: [
      { label: "GitHub", href: "https://github.com/leandronoijo/r3nd" }
    ]
  }
};
