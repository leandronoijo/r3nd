/**
 * Agent Registry - Declarative configuration for agent commands
 * 
 * Each agent entry defines:
 * - name: command name (e.g., 'tech-spec' becomes 'r3nd agents tech-spec')
 * - description: help text for the command
 * - filesDir: relative directory to scan for input files (can be a function for dynamic resolution)
 * - agentFile: path to the agent profile markdown file (or function returning it)
 * - promptTemplate: function that generates the prompt text
 */

function getSharedSummaryWorkflow(doneFile) {
  return `\n\nSHARED SUMMARY WORKFLOW:
# Summary Workflow

Apply this workflow after you have delivered the requested artifact or reached a meaningful checkpoint.

1. Provide a concise summary of the current result, including major decisions, blockers, and any assumptions that affect next steps.
2. Ask the user the exact question: **"Are you satisfied with the current result? (yes/no)"**
3. If the user is not satisfied or requests changes, address the feedback and repeat step 2.
4. If the user confirms satisfaction:
   - If the current task is producing a retro report in \`rnd/retros/\`, do not create an agent summary log.
   - Otherwise create a summary log in \`rnd/agent_summaries/<agent-id>-<timestamp>.md\`.
   - Use the current command or agent name as \`<agent-id>\`. If that is unavailable, use the active task skill name without the \`/SKILL.md\` suffix.
   - Use a timestamp in \`YYYY-MM-DD-HH-MM-SS\` format.
5. Write the summary log in markdown with this structure:

\`\`\`markdown
# <agent-id> - Interaction Summary
**Date:** [current date]
**Task:** [brief description]

## Summary
[What was accomplished]

## Key Points
- [Important decision or change 1]
- [Important decision or change 2]

## User Interactions
- [Summary of user feedback and requested changes]

## Notes
[Any additional context for future reference]
\`\`\`

6. If your execution environment uses a completion or done file, create the summary log before that completion file.
7. These summary logs are inputs for the retro workflow, so keep them factual and high-signal.

For this run, if your environment uses a completion or done file, use "${doneFile}".`;
}

const AGENT_REGISTRY = [
  {
    name: 'create-product-spec',
    description: 'Generate a product specification from a feature description',
    filesDir: null, // No file selection - uses free text input
    agentFile: (specDirPath) => `${specDirPath}/skills/create-product-spec/SKILL.md`,
    useFreeTextInput: true,
    promptTemplate: (agentFile, userInput, specDirPath) => 
      `Using the task skill at ${agentFile} as instructions, please create a product specification for the following feature description:\n\n${userInput}\n\nFollow the template at ${specDirPath}/templates/product_spec.md and ensure all sections are properly filled out. Generate an appropriate feature-id based on the description.\n\nIMPORTANT: Save the product specification in the directory: ${specDirPath}/product_specs/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the product specification, provide a summary of the document you created.\n2. Ask if there are any sections that need clarification or additional detail.\n3. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'create-tech-spec',
    description: 'Generate a technical specification from a product spec',
    filesDir: (specDirPath) => `${specDirPath}/product_specs`,
    agentFile: (specDirPath) => `${specDirPath}/skills/create-tech-spec/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) => 
      `Using the task skill at ${agentFile} as instructions, please create a technical specification for the following product spec:\n\n${targetFile}\n\nFollow the template at ${specDirPath}/templates/tech_spec.md and ensure all sections are properly filled out.\n\nIMPORTANT: Save the technical specification in the directory: ${specDirPath}/tech_specs/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the technical specification, provide a summary highlighting the key technical decisions and architecture.\n2. Ask if there are any technical aspects that need further elaboration or alternative approaches to consider.\n3. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'create-build-plan',
    description: 'Generate a build plan from a technical specification',
    filesDir: (specDirPath) => `${specDirPath}/tech_specs`,
    agentFile: (specDirPath) => `${specDirPath}/skills/create-build-plan/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, please create a build plan for the following input:\n\n${targetFile}\n\nTreat the input as either a technical specification path or a concrete problem statement. Follow the template at ${specDirPath}/templates/build_plan.md and break down the work into atomic, testable tasks.\n\nIMPORTANT: Save the build plan in the directory: ${specDirPath}/build_plans/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the build plan, provide a summary of the tasks and estimated complexity.\n2. Ask if any tasks need to be broken down further or if dependencies are clear.\n3. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'implement-build-plan',
    description: 'Implement a build plan to completion',
    filesDir: (specDirPath) => `${specDirPath}/build_plans`,
    agentFile: (specDirPath) => `${specDirPath}/skills/implement-build-plan/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, please implement the following build plan to completion:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the task skill. Read instruction files before starting. Test as you implement. Mark tasks complete as you finish them.`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After implementing each major task or checkpoint, provide a summary of what was completed and any issues encountered.\n2. Ask if there are any concerns about the implementation or if testing reveals problems.\n3. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.\n4. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'implement-feature',
    description: 'Implement a feature with coordinator and teammate agents to completion',
    filesDir: (specDirPath) => `${specDirPath}/tech_specs`,
    agentFile: (specDirPath) => `${specDirPath}/skills/implement-feature/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, please run coordinated feature implementation for the following input path:\n\n${targetFile}\n\nTreat this input as either:\n- a tech-spec file path, or\n- a feature directory path.\n\nIMPORTANT: Execute the strict workflow in the task skill, including build-plan assurance, per-task QA gates, and mandatory final E2E QA. Write required run artifacts under ${specDirPath}/agent_runs/.`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After each major implementation checkpoint, provide a summary of task progress, task-gate status, and blockers.\n2. Ask if there are any concerns about the coordination flow, task QA gates, or final E2E outcomes.\n3. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.\n4. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'create-test-cases',
    description: 'Generate E2E test cases from a build plan',
    filesDir: (specDirPath) => `${specDirPath}/build_plans`,
    agentFile: (specDirPath) => `${specDirPath}/skills/create-test-cases/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, please create E2E test cases for the following build plan:\n\n${targetFile}\n\nFollow the template at ${specDirPath}/templates/test_cases.md and generate up to 20 sanity-level test cases that validate core flows and interactions between touched components.\n\nIMPORTANT: Save the test cases in the directory: ${specDirPath}/test_cases/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the test cases, provide a summary of the test coverage and priority distribution.\n2. Ask if any critical scenarios are missing or if existing test cases need refinement.\n3. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'run-e2e-tests',
    description: 'Generate, run, and diagnose E2E tests from test cases',
    filesDir: (specDirPath) => `${specDirPath}/test_cases`,
    agentFile: (specDirPath) => `${specDirPath}/skills/run-e2e-tests/SKILL.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, please implement and execute E2E tests for the following test cases:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the task skill. Read ${specDirPath}/instructions/e2e-testing.instructions.md before starting. Start required services, run tests sequentially, diagnose failures, and generate a comprehensive result report.\n\nTest results should be saved to: ${specDirPath}/e2e-results/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After executing tests and generating the result report, provide a summary of test outcomes and failure categories.\n2. Ask if any failures need deeper investigation or if test methodology needs adjustment.\n3. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.\n4. Then follow the shared summary workflow below.${getSharedSummaryWorkflow(doneFile)}`
  },
  {
    name: 'create-retro-report',
    description: 'Review PR discussions and create a retro report',
    filesDir: null, // No file selection - uses free text input (PR number or URL)
    agentFile: (specDirPath) => `${specDirPath}/skills/create-retro-report/SKILL.md`,
    useFreeTextInput: true,
    promptTemplate: (agentFile, userInput, specDirPath) =>
      `Using the task skill at ${agentFile} as instructions, analyze the following PR identifier or URL:\n\n${userInput}\n\nFollow the template at ${specDirPath}/templates/retro.md and ensure all sections are properly filled out. Analyze review comments, review threads, and issue comments to identify improvements to agents, templates, or instructions.\n\nIMPORTANT: Before analyzing the PR, read all agent summary logs from ${specDirPath}/agent_summaries/ to understand what happened during the development process. These logs contain summaries of agent interactions and will provide context about the workflow that led to this PR.\n\nSave the retro report in: ${specDirPath}/retros/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. First, read all files in ${specDirPath}/agent_summaries/ to understand the development process.\n2. Then review the PR discussion and comments.\n3. After completing the retro report, provide a summary of the key findings and recommendations.\n4. Ask if any areas need further analysis or if additional recommendations should be included.\n5. Then follow the shared summary workflow below.\n6. Do not create an agent summary log for the retro workflow.\n7. After the user confirms satisfaction, create the file named "${doneFile}" in the current directory.\n8. After creating the done file, delete all files in ${specDirPath}/agent_summaries/ to clean up for the next development cycle.${getSharedSummaryWorkflow(doneFile)}`
  }
];

/**
 * Get all registered agents
 * @returns {Array} Array of agent configurations
 */
function getAgents() {
  return AGENT_REGISTRY;
}

/**
 * Get a specific agent by name
 * @param {string} name - Agent name
 * @returns {Object|undefined} Agent configuration or undefined if not found
 */
function getAgent(name) {
  return AGENT_REGISTRY.find(agent => agent.name === name);
}

function resolveAgentConfig(agentConfig, specDirName, specDirBase = '') {
  if (!specDirName) {
    throw new Error('specDirName is required to resolve agent configuration');
  }

  const resolved = { ...agentConfig };
  resolved.specDirName = specDirName; // Store for later use
  resolved.specDirBase = specDirBase; // Store base directory (e.g., "apps/my-app")
  
  // Compute full spec directory path
  const fullSpecDir = specDirBase ? `${specDirBase}/${specDirName}` : specDirName;
  resolved.fullSpecDir = fullSpecDir;
  
  resolved.agentFile = typeof agentConfig.agentFile === 'function'
    ? agentConfig.agentFile(fullSpecDir)
    : agentConfig.agentFile;
  resolved.filesDir = typeof agentConfig.filesDir === 'function'
    ? agentConfig.filesDir(fullSpecDir)
    : agentConfig.filesDir;
  return resolved;
}

/**
 * Register a new agent dynamically (for extensibility)
 * @param {Object} agentConfig - Agent configuration object
 */
function registerAgent(agentConfig) {
  const required = ['name', 'description', 'filesDir', 'agentFile', 'promptTemplate'];
  const missing = required.filter(field => !agentConfig[field]);
  
  if (missing.length > 0) {
    throw new Error(`Agent registration missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate that promptTemplate is a function
  if (typeof agentConfig.promptTemplate !== 'function') {
    throw new Error(`Agent registration missing required fields: promptTemplate must be a function`);
  }
  
  if (AGENT_REGISTRY.find(a => a.name === agentConfig.name)) {
    throw new Error(`Agent with name "${agentConfig.name}" is already registered`);
  }
  
  AGENT_REGISTRY.push(agentConfig);
}

module.exports = {
  getAgents,
  getAgent,
  resolveAgentConfig,
  registerAgent
};
