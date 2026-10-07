# Completion Summary

After delivering an artifact or reaching a meaningful checkpoint:

1. Summarize the result, important decisions, verification, blockers, and assumptions affecting next steps.
2. Follow the task skill's Learning Journal instructions during work, not only at completion. Before handoff or a completion signal, save the observed checkpoint/outcome and include the run path when useful. If capture was skipped or unavailable, say so briefly rather than creating a fictitious log.
3. Address user feedback under the existing task scope. Do not add a satisfaction question as a prerequisite to saving evidence or signaling completed work; preserve any approval/QA choices explicitly required by the task skill.
4. Do not create new legacy `rnd/agent_summaries/` files. Existing summaries remain readable evidence and must not be deleted.
5. When producing a retro, summarize its period, coverage, evidence gaps, and proposed edits. Do not journal the retro's own generation or create a completion record that would recursively feed the next retro.

If the environment uses a done file, create it only after the requested work and required verification are complete, and after any applicable outcome/checkpoint record is saved. A partial retro must remain marked partial in its report; a done file does not make its coverage complete.
