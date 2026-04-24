(function () {
  "use strict";

  function cloneTemplate(templateId) {
    const template = document.getElementById(templateId);
    if (!template) {
      throw new Error("Missing template: " + templateId);
    }
    const node = template.content.firstElementChild;
    if (!node) {
      throw new Error("Empty template: " + templateId);
    }
    return node.cloneNode(true);
  }

  function getSlot(root, slotName) {
    if (root.matches && root.matches('[data-slot="' + slotName + '"]')) {
      return root;
    }
    return root.querySelector('[data-slot="' + slotName + '"]');
  }

  function setText(root, slotName, value) {
    const slot = getSlot(root, slotName);
    if (slot) {
      slot.textContent = value == null ? "" : String(value);
    }
  }

  function mountRepeat(root, repeatName, nodes) {
    const target = root.querySelector('[data-repeat="' + repeatName + '"]');
    if (!target) {
      return;
    }
    target.replaceChildren(...nodes);
  }

  const componentRegistry = {
    NavLink: renderNavLink,
    NavAction: renderNavAction,
    PrimaryButton: renderPrimaryButton,
    SecondaryButton: renderSecondaryButton,
    HeroFeatureItem: renderHeroFeatureItem,
    HeroWorkflowNode: renderHeroWorkflowNode,
    WorkflowModeOption: renderWorkflowModeOption,
    TimelineStep: renderTimelineStep,
    DetailRow: renderDetailRow,
    DetailCard: renderDetailCard,
    MetricPill: renderMetricPill,
    ToolBadge: renderToolBadge,
    SecondarySupportCard: renderSecondarySupportCard,
    DashboardTab: renderDashboardTab,
    CheckpointItem: renderCheckpointItem,
    PhaseCard: renderPhaseCard,
    ProofCard: renderProofCard,
    CommandSnippet: renderCommandSnippet,
    BehaviorItem: renderBehaviorItem,
    SetupPathCard: renderSetupPathCard,
    FooterLink: renderFooterLink,
    TopNav: renderTopNav,
    HeroSection: renderHeroSection,
    WorkflowPreviewSection: renderWorkflowPreviewSection,
    WhyItWorksSection: renderWhyItWorksSection,
    GetStartedSection: renderGetStartedSection,
    AutonomousDashboardSection: renderAutonomousDashboardSection,
    ClosingStatementSection: renderClosingStatementSection,
    FinalCTASection: renderFinalCTASection,
    Footer: renderFooter
  };

  function renderComponent(name, data) {
    const renderer = componentRegistry[name];
    if (!renderer) {
      throw new Error("Unknown component: " + name);
    }
    return renderer(data || {});
  }

  function renderNavLink(data) {
    const el = cloneTemplate("tpl-nav-link");
    setText(el, "label", data.label);
    el.href = data.href || "#";
    if (data.active) {
      el.classList.add("text-cyan-400", "font-bold");
      el.classList.remove("text-slate-400");
    } else {
      el.classList.add("text-slate-400");
      el.classList.remove("text-cyan-400", "font-bold");
    }
    return el;
  }

  function renderNavAction(data) {
    const el = cloneTemplate("tpl-nav-action");
    setText(el, "label", data.label);
    el.href = data.href || "#";
    if (data.variant === "primary") {
      el.className = "inline-flex items-center bg-primary hover:bg-primary-container text-on-primary font-bold px-5 py-2 rounded-lg transition-transform active:scale-95";
    } else if (data.variant === "secondary") {
      el.className = "inline-flex items-center ghost-border text-on-surface font-bold px-5 py-2 rounded-lg hover:bg-surface-variant transition-colors";
    } else {
      el.className = "inline-flex items-center text-slate-400 hover:text-white transition-colors";
    }
    return el;
  }

  function renderPrimaryButton(data) {
    const el = cloneTemplate("tpl-primary-button");
    setText(el, "label", data.label);
    setText(el, "icon", data.icon || "arrow_forward");
    if (!data.icon) {
      const icon = getSlot(el, "icon");
      if (icon) {
        icon.remove();
      }
    }
    if (data.className) {
      el.className = data.className;
    }
    if (data.href) {
      const link = document.createElement("a");
      link.href = data.href;
      link.className = el.className;
      link.innerHTML = el.innerHTML;
      if (data.target) {
        link.target = data.target;
      }
      if (data.target === "_blank") {
        link.rel = "noopener noreferrer";
      }
      return link;
    }
    return el;
  }

  function renderSecondaryButton(data) {
    const el = cloneTemplate("tpl-secondary-button");
    setText(el, "label", data.label);
    if (data.className) {
      el.className = data.className;
    }
    if (data.href) {
      const link = document.createElement("a");
      link.href = data.href;
      link.className = el.className;
      link.innerHTML = el.innerHTML;
      if (data.target) {
        link.target = data.target;
      }
      if (data.target === "_blank") {
        link.rel = "noopener noreferrer";
      }
      return link;
    }
    return el;
  }

  function renderHeroFeatureItem(data) {
    const el = cloneTemplate("tpl-hero-feature-item");
    setText(el, "icon", data.icon);
    setText(el, "label", data.label);
    return el;
  }

  function renderHeroWorkflowNode(data) {
    const el = cloneTemplate("tpl-hero-workflow-node");
    const iconWrap = getSlot(el, "icon-wrap");
    const icon = getSlot(el, "icon");
    const fill = getSlot(el, "progress-fill");
    const status = getSlot(el, "status");

    setText(el, "title", data.title);
    setText(el, "icon", data.icon);

    if (data.state === "complete") {
      iconWrap.className = "w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-primary/20 group-hover/node:border-primary transition-colors";
      icon.className = "material-symbols-outlined text-primary";
      fill.className = "h-full bg-primary w-full shadow-[0_0_10px_#3adffa]";
      status.innerHTML = '<span class="material-symbols-outlined text-emerald-400">check_circle</span>';
    } else if (data.state === "pending") {
      iconWrap.className = "w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/10 group-hover/node:border-primary transition-colors";
      icon.className = "material-symbols-outlined text-secondary";
      fill.className = "h-full bg-secondary";
      fill.style.width = data.progress || "75%";
      status.innerHTML = '<div class="px-2 py-1 bg-secondary/10 border border-secondary/20 text-[10px] text-secondary font-bold rounded uppercase">Pending</div>';
    } else {
      el.classList.add("opacity-40");
      iconWrap.className = "w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/10";
      icon.className = "material-symbols-outlined text-on-surface-variant";
      const title = getSlot(el, "title");
      if (title) {
        title.className = "text-sm font-bold text-on-surface-variant";
      }
      fill.remove();
      const track = getSlot(el, "progress-track");
      if (track) {
        track.className = "h-1.5 w-full bg-surface-container rounded-full mt-2";
      }
      status.innerHTML = '<span class="material-symbols-outlined text-on-surface-variant">lock</span>';
    }
    if (data.state !== "pending" && fill) {
      fill.style.width = data.progress || "100%";
    }

    return el;
  }

  function renderWorkflowModeOption(data) {
    const el = cloneTemplate("tpl-workflow-mode-option");
    setText(el, "icon", data.icon);
    setText(el, "title", data.title);
    setText(el, "description", data.description);
    if (data.key) {
      el.dataset.modeKey = data.key;
    }
    el.setAttribute("aria-pressed", data.active ? "true" : "false");

    const icon = getSlot(el, "icon");
    if (data.active) {
      el.className = "flex flex-col items-start p-6 rounded-xl bg-surface-variant border border-primary/30 shadow-[0_0_20px_rgba(58,223,250,0.1)] transition-all";
      icon.className = "material-symbols-outlined text-primary mb-4";
      icon.style.fontVariationSettings = "'FILL' 1";
      getSlot(el, "title").className = "text-lg font-headline font-bold text-on-surface";
    } else {
      el.className = "flex flex-col items-start p-6 rounded-xl ghost-border hover:bg-surface-variant transition-all";
      icon.className = "material-symbols-outlined text-on-surface-variant mb-4";
      icon.style.fontVariationSettings = "'FILL' 0";
      getSlot(el, "title").className = "text-lg font-headline font-bold text-on-surface-variant";
    }
    return el;
  }

  function renderTimelineStep(data) {
    const el = cloneTemplate("tpl-timeline-step");
    setText(el, "label", data.shortLabel || data.label);
    if (data.label) {
      el.title = data.label;
    }
    const badge = getSlot(el, "badge");
    const badgeIcon = data.badgeIcon
      ? '<span class="material-symbols-outlined text-xs">' + data.badgeIcon + "</span>"
      : String(data.badge || "");

    if (data.type === "agent") {
      badge.className = "w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary shadow-[0_0_15px_#3adffa33]";
      getSlot(el, "label").classList.add("text-primary");
    } else if (data.type === "gate") {
      badge.className = "w-10 h-10 rounded-lg bg-secondary/20 border border-secondary flex items-center justify-center text-secondary";
      getSlot(el, "label").classList.add("text-secondary");
    } else {
      badge.className = "w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-on-surface-variant";
    }
    badge.innerHTML = badgeIcon;
    return el;
  }

  function renderDetailRow(data) {
    const el = cloneTemplate("tpl-detail-row");
    setText(el, "label", data.label);
    setText(el, "value", data.value);
    return el;
  }

  function renderDetailCard(data) {
    const el = cloneTemplate("tpl-detail-card");
    setText(el, "icon", data.icon);
    setText(el, "title", data.title);
    const icon = getSlot(el, "icon");
    if (data.iconClass) {
      icon.className = "material-symbols-outlined " + data.iconClass;
    }
    mountRepeat(el, "rows", (data.rows || []).map(function (row) {
      return renderComponent("DetailRow", row);
    }));
    return el;
  }

  function renderMetricPill(data) {
    const el = cloneTemplate("tpl-metric-pill");
    setText(el, "label", data.label);
    setText(el, "value", data.value);
    const value = getSlot(el, "value");
    if (value && data.valueClass) {
      value.className = "text-xs font-bold " + data.valueClass;
    }
    return el;
  }

  function renderToolBadge(data) {
    const el = cloneTemplate("tpl-tool-badge");
    setText(el, "icon", data.icon);
    setText(el, "label", data.label);
    const icon = getSlot(el, "icon");
    icon.className = "material-symbols-outlined " + (data.iconClass || "text-on-surface");
    return el;
  }

  function renderSecondarySupportCard(data) {
    const el = cloneTemplate("tpl-secondary-support-card");
    setText(el, "icon", data.icon);
    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title", data.title);
    setText(el, "description", data.description);
    const icon = getSlot(el, "icon");
    icon.className = "material-symbols-outlined text-3xl " + (data.iconClass || "text-on-surface");

    const footerHost = getSlot(el, "footer");
    if (data.trail && Array.isArray(data.trail)) {
      footerHost.className = "flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-8";
      data.trail.forEach(function (part, index) {
        const partNode = document.createElement("span");
        partNode.textContent = part;
        if (index === data.trailActiveIndex) {
          partNode.className = "text-primary font-bold";
        }
        footerHost.appendChild(partNode);
        if (index < data.trail.length - 1) {
          const sep = document.createElement("span");
          sep.className = "material-symbols-outlined text-[12px]";
          sep.textContent = "chevron_right";
          footerHost.appendChild(sep);
        }
      });
    }
    return el;
  }

  function renderDashboardTab(data) {
    const el = cloneTemplate("tpl-dashboard-tab");
    setText(el, "label", data.label);
    if (data.key) {
      el.dataset.tabKey = data.key;
    }
    el.setAttribute("aria-pressed", data.active ? "true" : "false");
    if (data.active) {
      el.className = "px-8 py-5 text-sm font-headline tracking-widest uppercase text-primary border-b-2 border-primary bg-primary/5 whitespace-nowrap";
    } else {
      el.className = "px-8 py-5 text-sm font-headline tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap";
    }
    return el;
  }

  function renderCheckpointItem(data) {
    const el = cloneTemplate("tpl-checkpoint-item");
    setText(el, "icon", data.icon);
    setText(el, "label", data.label);
    const icon = getSlot(el, "icon");
    icon.className = "material-symbols-outlined text-lg " + (data.iconClass || "text-secondary");
    if (data.fill) {
      icon.style.fontVariationSettings = "'FILL' 1";
    }
    return el;
  }

  function renderPhaseCard(data) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-3" + (data.type === "loop" ? " relative" : "");

    const card = cloneTemplate("tpl-phase-card");
    setText(card, "eyebrow", data.eyebrow);
    setText(card, "title", data.title);
    setText(card, "icon", data.icon);
    setText(card, "description", data.description || "");

    const cardNode = getSlot(card, "card");
    const eyebrow = getSlot(card, "eyebrow");
    const icon = getSlot(card, "icon");
    const description = getSlot(card, "description");

    if (data.type === "gate") {
      cardNode.className = "p-4 bg-surface-container shadow-[0_0_15px_rgba(172,138,255,0.15)] border border-secondary/30 rounded";
      eyebrow.className = "text-[9px] uppercase tracking-tighter text-secondary font-bold mb-1 block";
      icon.className = "material-symbols-outlined text-sm text-secondary";
      if (description) {
        description.className = "text-[10px] leading-tight mt-2 text-on-surface-variant phase-subtitle";
      }
    } else if (data.type === "loop") {
      cardNode.className = "p-4 bg-surface-container-highest ghost-border border-l-2 border-error rounded";
      eyebrow.className = "text-[9px] uppercase tracking-tighter text-error font-bold mb-1 block";
      icon.className = "material-symbols-outlined text-sm text-error";
      if (description) {
        description.className = "text-[10px] leading-tight mt-2 text-on-surface-variant phase-subtitle";
      }
    } else {
      cardNode.className = "p-4 bg-surface-container-highest ghost-border border-l-2 border-primary rounded";
      eyebrow.className = "text-[9px] uppercase tracking-tighter text-on-surface-variant font-bold mb-1 block";
      icon.className = "material-symbols-outlined text-sm text-primary";
      if (description) {
        description.className = "text-[10px] leading-tight mt-2 text-on-surface-variant phase-subtitle";
      }
    }

    if (description && !data.description) {
      description.remove();
    }

    wrapper.appendChild(card);

    if (data.type === "loop") {
      const loopSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      loopSvg.setAttribute("class", "absolute -right-4 top-1/2 w-16 h-48 -translate-y-1/2 overflow-visible pointer-events-none opacity-20 hidden sm:block");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M 0 0 C 40 0, 40 180, 0 180");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#ff716c");
      path.setAttribute("stroke-dasharray", "4 2");
      path.setAttribute("stroke-width", "1.5");
      loopSvg.appendChild(path);
      wrapper.appendChild(loopSvg);
    }

    return wrapper;
  }

  function renderProofCard(data) {
    const el = cloneTemplate("tpl-proof-card");
    setText(el, "icon", data.icon);
    setText(el, "title", data.title);
    setText(el, "description", data.description);
    const icon = getSlot(el, "icon");
    icon.className = "material-symbols-outlined text-3xl mb-4 group-hover:scale-110 transition-transform " + (data.iconClass || "text-primary");
    return el;
  }

  function renderCommandSnippet(data) {
    const el = cloneTemplate("tpl-command-snippet");
    setText(el, "label", data.label);
    setText(el, "command", data.command);
    return el;
  }

  function renderBehaviorItem(data) {
    const el = cloneTemplate("tpl-behavior-item");
    setText(el, "text", data.text);
    return el;
  }

  function renderSetupPathCard(data) {
    const el = cloneTemplate("tpl-setup-path-card");
    setText(el, "name", data.name);
    setText(el, "summary", data.summary);
    mountRepeat(el, "behaviors", (data.behaviors || []).map(function (item) {
      return renderComponent("BehaviorItem", { text: item });
    }));
    mountRepeat(el, "commands", (data.commands || []).map(function (item) {
      return renderComponent("CommandSnippet", item);
    }));
    return el;
  }

  function renderFooterLink(data) {
    const el = cloneTemplate("tpl-footer-link");
    setText(el, "label", data.label);
    el.href = data.href || "#";
    return el;
  }

  function renderTopNav(data) {
    const el = cloneTemplate("tpl-top-nav");
    setText(el, "brand", data.brand);
    mountRepeat(el, "actions", (data.actions || []).map(function (item) {
      return renderComponent("NavAction", item);
    }));
    return el;
  }

  function renderHeroSection(data) {
    const el = cloneTemplate("tpl-hero-section");
    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title-prefix", data.titlePrefix);
    setText(el, "title-accent", data.titleAccent);
    setText(el, "description", data.description);
    setText(el, "terminal-label", data.terminalLabel);
    setText(el, "gate-title", data.gate.title);
    setText(el, "gate-subtitle", data.gate.subtitle);

    mountRepeat(el, "actions", (data.actions || []).map(function (action) {
      if (action.variant === "secondary") {
        return renderComponent("SecondaryButton", action);
      }
      return renderComponent("PrimaryButton", action);
    }));

    mountRepeat(el, "features", (data.features || []).map(function (feature) {
      return renderComponent("HeroFeatureItem", feature);
    }));

    mountRepeat(el, "workflow-nodes", (data.workflowNodes || []).map(function (node) {
      const rendered = renderComponent("HeroWorkflowNode", node);
      rendered.classList.add("group/node");
      return rendered;
    }));
    return el;
  }

  function renderWorkflowPreviewSection(data) {
    const el = cloneTemplate("tpl-workflow-preview-section");
    if (data.sectionId) {
      el.id = data.sectionId;
    }
    const selectedModeKey = data.activeMode || ((data.modes && data.modes[0] && data.modes[0].key) || "fullControl");
    const selectedWorkflow = (data.workflows && data.workflows[selectedModeKey]) || {};
    const sequence = selectedWorkflow.sequence || data.sequence || {};
    const detailCards = selectedWorkflow.detailCards || data.detailCards || [];

    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title-line-1", data.titleLine1 || data.title || "");
    setText(el, "title-line-2", data.titleLine2 || "");
    setText(el, "description", data.description);
    setText(el, "sequence-title", sequence.title || "");
    setText(el, "legend-agent", sequence.legendAgent || "Agent");
    setText(el, "legend-gate", sequence.legendGate || "Human Gate");
    setText(el, "timeline-tail", sequence.tail || "");

    mountRepeat(el, "modes", (data.modes || []).map(function (mode) {
      return renderComponent("WorkflowModeOption", {
        key: mode.key,
        icon: mode.icon,
        title: mode.title,
        description: mode.description,
        active: mode.key === selectedModeKey
      });
    }));

    const timelineNodes = [];
    (sequence.steps || []).forEach(function (step) {
      timelineNodes.push(renderComponent("TimelineStep", step));
    });
    mountRepeat(el, "timeline", timelineNodes);

    mountRepeat(el, "detail-cards", detailCards.map(function (card) {
      return renderComponent("DetailCard", card);
    }));

    el.querySelectorAll("[data-mode-key]").forEach(function (modeButton) {
      modeButton.addEventListener("click", function () {
        const nextMode = modeButton.dataset.modeKey;
        if (!nextMode || nextMode === data.activeMode) {
          return;
        }
        data.activeMode = nextMode;
        renderPage(model);
      });
    });

    return el;
  }

  function renderWhyItWorksSection(data) {
    const el = cloneTemplate("tpl-why-it-works-section");
    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title-prefix", data.titlePrefix);
    setText(el, "title-accent", data.titleAccent);
    setText(el, "description", data.description);
    setText(el, "durable-title", data.durableTitle);
    setText(el, "durable-description", data.durableDescription);
    setText(el, "execution-title", data.executionTitle);
    setText(el, "execution-description", data.executionDescription);
    setText(el, "tool-title", data.toolTitle);
    setText(el, "tool-description", data.toolDescription);

    mountRepeat(el, "tool-badges", (data.toolBadges || []).map(function (badge) {
      return renderComponent("ToolBadge", badge);
    }));

    mountRepeat(el, "support-cards", (data.supportCards || []).map(function (card) {
      return renderComponent("SecondarySupportCard", card);
    }));

    return el;
  }

  function renderGetStartedSection(data) {
    const el = cloneTemplate("tpl-get-started-section");
    if (data.sectionId) {
      el.id = data.sectionId;
    }
    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title-line-1", data.titleLine1 || "");
    setText(el, "title-line-2", data.titleLine2 || "");
    setText(el, "description", data.description || "");
    setText(el, "full-guide-label", data.fullGuideLabel || "Full getting started guide");
    setText(el, "install-title", (data.install && data.install.title) || "");
    setText(el, "install-description", (data.install && data.install.description) || "");
    setText(el, "setup-title", (data.setup && data.setup.title) || "");
    setText(el, "setup-description", (data.setup && data.setup.description) || "");
    const fullGuideLink = getSlot(el, "full-guide-link");
    if (fullGuideLink) {
      if (data.fullGuideHref) {
        fullGuideLink.href = data.fullGuideHref;
      } else {
        fullGuideLink.remove();
      }
    }

    mountRepeat(el, "install-commands", (((data.install || {}).commands) || []).map(function (item) {
      return renderComponent("CommandSnippet", item);
    }));
    mountRepeat(el, "setup-paths", (((data.setup || {}).paths) || []).map(function (item) {
      return renderComponent("SetupPathCard", item);
    }));
    return el;
  }

  function renderAutonomousDashboardSection(data) {
    const el = cloneTemplate("tpl-autonomous-dashboard-section");
    const selectedTabKey = data.activeTab || ((data.tabs && data.tabs[0] && data.tabs[0].key) || "implementFeature");
    const selectedWorkflow = (data.workflows && data.workflows[selectedTabKey]) || {};

    setText(el, "eyebrow", data.eyebrow);
    setText(el, "title-line-1", data.titleLine1);
    setText(el, "title-line-2", data.titleLine2);
    setText(el, "description", data.description);
    setText(el, "note", data.note);
    setText(el, "summary", selectedWorkflow.summary || data.summary || "");
    setText(el, "prompt", " " + (selectedWorkflow.prompt || data.prompt || ""));
    setText(el, "outcome", selectedWorkflow.outcome || data.outcome || "");

    mountRepeat(el, "tabs", (data.tabs || []).map(function (tab) {
      return renderComponent("DashboardTab", {
        key: tab.key,
        label: tab.label,
        active: tab.key === selectedTabKey
      });
    }));
    mountRepeat(el, "checkpoints", ((selectedWorkflow.checkpoints || data.checkpoints) || []).map(function (item) {
      return renderComponent("CheckpointItem", item);
    }));
    mountRepeat(el, "phases", ((selectedWorkflow.phases || data.phases) || []).map(function (phase) {
      return renderComponent("PhaseCard", phase);
    }));
    mountRepeat(el, "proof-cards", (data.proofCards || []).map(function (item) {
      return renderComponent("ProofCard", item);
    }));

    el.querySelectorAll("[data-tab-key]").forEach(function (tabButton) {
      tabButton.addEventListener("click", function () {
        const nextTab = tabButton.dataset.tabKey;
        if (!nextTab || nextTab === data.activeTab) {
          return;
        }
        data.activeTab = nextTab;
        renderPage(model);
      });
    });

    return el;
  }

  function renderClosingStatementSection(data) {
    const el = cloneTemplate("tpl-closing-statement-section");
    setText(el, "title-line-1", data.titleLine1);
    setText(el, "title-line-2", data.titleLine2);
    setText(el, "description", data.description);

    mountRepeat(el, "actions", (data.actions || []).map(function (action) {
      if (action.variant === "primaryLarge") {
        return renderComponent("PrimaryButton", {
          label: action.label,
          className: "w-full md:w-auto px-10 py-4 bg-primary text-on-primary font-headline font-bold text-lg uppercase tracking-tight rounded-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(58,223,250,0.2)]"
        });
      }
      return renderComponent("SecondaryButton", {
        label: action.label,
        className: "w-full md:w-auto px-10 py-4 ghost-border text-on-surface font-headline font-bold text-lg uppercase tracking-tight rounded-lg hover:bg-surface-variant transition-colors"
      });
    }));

    return el;
  }

  function renderFinalCTASection(data) {
    const el = cloneTemplate("tpl-final-cta-section");
    setText(el, "title", data.title);

    mountRepeat(el, "actions", (data.actions || []).map(function (action) {
      if (action.variant === "primary") {
        return renderComponent("PrimaryButton", {
          label: action.label,
          className: "bg-primary text-on-primary font-bold px-10 py-4 rounded-lg shadow-[0_0_40px_rgba(58,223,250,0.2)]"
        });
      }
      return renderComponent("SecondaryButton", {
        label: action.label,
        className: "ghost-border text-on-surface font-bold px-10 py-4 rounded-lg hover:bg-surface-variant transition-colors"
      });
    }));

    return el;
  }

  function renderFooter(data) {
    const el = cloneTemplate("tpl-footer");
    setText(el, "brand", data.brand);
    setText(el, "copyright", data.copyright);
    mountRepeat(el, "links", (data.links || []).map(function (link) {
      return renderComponent("FooterLink", link);
    }));
    return el;
  }

  function renderPage(model) {
    const root = document.getElementById("site-root");
    const fragment = document.createDocumentFragment();
    const main = document.createElement("main");
    main.className = "overflow-x-hidden";

    fragment.appendChild(renderComponent("TopNav", model.nav));
    main.appendChild(renderComponent("HeroSection", model.hero));
    main.appendChild(renderComponent("WorkflowPreviewSection", model.workflowPreview));
    main.appendChild(renderComponent("WhyItWorksSection", model.whyItWorks));
    main.appendChild(renderComponent("GetStartedSection", model.getStarted));
    main.appendChild(renderComponent("AutonomousDashboardSection", model.dashboard));
    main.appendChild(renderComponent("ClosingStatementSection", model.closing));
    fragment.appendChild(main);
    fragment.appendChild(renderComponent("Footer", model.footer));

    root.replaceChildren(fragment);
  }

  function updateByPath(obj, path, value) {
    const keys = path.split(".");
    let cursor = obj;
    for (let i = 0; i < keys.length - 1; i += 1) {
      if (cursor[keys[i]] == null || typeof cursor[keys[i]] !== "object") {
        cursor[keys[i]] = {};
      }
      cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;
  }

  const model = window.PAGE_MODEL || {};
  renderPage(model);

  window.r3ndPage = {
    model: model,
    renderPage: function () {
      renderPage(model);
    },
    renderComponent: renderComponent,
    set: function (path, value) {
      updateByPath(model, path, value);
      renderPage(model);
    }
  };
})();
