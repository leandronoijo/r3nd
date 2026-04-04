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

/**
 * Generate summary log creation instructions for agents
 * @param {string} agentName - Name of the agent
 * @param {string} doneFile - Name of the done file
 * @param {string} specDirPath - Full spec directory path (e.g., "r3nd" or "apps/my-app/r3nd")
 * @returns {string} Instructions for creating summary log
 */
function getSummaryLogInstructions(agentName, doneFile, specDirPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').substring(0, 19);
  const summaryFile = `${specDirPath}/agent_summaries/${agentName}-${timestamp}.md`;
  
  return `\n\nBEFORE CREATING THE DONE FILE:\n` +
    `Create a summary log file at "${summaryFile}" with the following content:\n` +
    `- A brief summary of what was accomplished\n` +
    `- Key decisions or changes made during the interaction\n` +
    `- Any important notes or context for future reference\n` +
    `- Format: Use markdown with clear sections\n` +
    `\nExample structure:\n` +
    `# ${agentName} - Interaction Summary\n` +
    `**Date:** [current date]\n` +
    `**Task:** [brief description]\n` +
    `\n` +
    `## Summary\n` +
    `[What was accomplished]\n` +
    `\n` +
    `## Key Points\n` +
    `- [Important decision 1]\n` +
    `- [Important decision 2]\n` +
    `\n` +
    `## Notes\n` +
    `[Any additional context]\n` +
    `\n` +
    `After creating this summary file, THEN create the file named "${doneFile}" to signal completion.`;
}

const AGENT_REGISTRY = [
  {
    name: 'create-product-spec',
    description: 'Generate a product specification from a feature description',
    filesDir: null, // No file selection - uses free text input
    agentFile: (specDirPath) => `${specDirPath}/agents/product-manager.md`,
    useFreeTextInput: true,
    promptTemplate: (agentFile, userInput, specDirPath) => 
      `Using the ${agentFile} agent profile as instructions, please create a product specification for the following feature description:\n\n${userInput}\n\nFollow the template at ${specDirPath}/templates/product_spec.md and ensure all sections are properly filled out. Generate an appropriate feature-id based on the description.\n\nIMPORTANT: Save the product specification in the directory: ${specDirPath}/product_specs/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the product specification, provide a summary of the document you created.\n2. Ask if there are any sections that need clarification or additional detail.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this product specification? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the product specification.${getSummaryLogInstructions('create-product-spec', doneFile, specDirPath)}`
  },
  {
    name: 'create-tech-spec',
    description: 'Generate a technical specification from a product spec',
    filesDir: (specDirPath) => `${specDirPath}/product_specs`,
    agentFile: (specDirPath) => `${specDirPath}/agents/architect.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) => 
      `Using the ${agentFile} agent profile as instructions, please create a technical specification for the following product spec:\n\n${targetFile}\n\nFollow the template at ${specDirPath}/templates/tech_spec.md and ensure all sections are properly filled out.\n\nIMPORTANT: Save the technical specification in the directory: ${specDirPath}/tech_specs/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the technical specification, provide a summary highlighting the key technical decisions and architecture.\n2. Ask if there are any technical aspects that need further elaboration or alternative approaches to consider.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this technical specification? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the technical specification.${getSummaryLogInstructions('create-tech-spec', doneFile, specDirPath)}`
  },
  {
    name: 'create-build-plan',
    description: 'Generate a build plan from a technical specification',
    filesDir: (specDirPath) => `${specDirPath}/tech_specs`,
    agentFile: (specDirPath) => `${specDirPath}/agents/team-lead.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, please create a build plan for the following technical specification:\n\n${targetFile}\n\nFollow the template at ${specDirPath}/templates/build_plan.md and break down the work into atomic, testable tasks.\n\nIMPORTANT: Save the build plan in the directory: ${specDirPath}/build_plans/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the build plan, provide a summary of the tasks and estimated complexity.\n2. Ask if any tasks need to be broken down further or if dependencies are clear.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this build plan? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the build plan.${getSummaryLogInstructions('create-build-plan', doneFile, specDirPath)}`
  },
  {
    name: 'implement-build-plan',
    description: 'Implement a build plan to completion',
    filesDir: (specDirPath) => `${specDirPath}/build_plans`,
    agentFile: (specDirPath) => `${specDirPath}/agents/developer.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, please implement the following build plan to its completion:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the agent profile. Read instruction files before starting. Test as you implement. Mark tasks complete as you finish them.`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After implementing each major task or checkpoint, provide a summary of what was completed and any issues encountered.\n2. Ask if there are any concerns about the implementation or if testing reveals problems.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with the current implementation progress? (yes/no)"\n4. If the user responds "yes" or confirms the implementation is complete and satisfactory:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has concerns, requests changes, or identifies bugs, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the complete implementation.\n7. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.${getSummaryLogInstructions('implement-build-plan', doneFile, specDirPath)}`
  },
  {
    name: 'implement-feature',
    description: 'Implement a feature with coordinator and teammate agents to completion',
    filesDir: (specDirPath) => `${specDirPath}/tech_specs`,
    agentFile: (specDirPath) => `${specDirPath}/agents/implement-feature.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, please run coordinated feature implementation for the following input path:\n\n${targetFile}\n\nTreat this input as either:\n- a tech-spec file path, or\n- a feature directory path.\n\nIMPORTANT: Execute the strict workflow in the agent profile, including build-plan assurance, per-task QA gates, and mandatory final E2E QA. Write required run artifacts under ${specDirPath}/agent_runs/.`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After each major implementation checkpoint, provide a summary of task progress, task-gate status, and blockers.\n2. Ask if there are any concerns about the coordination flow, task QA gates, or final E2E outcomes.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with the current implementation progress? (yes/no)"\n4. If the user responds "yes" or confirms the implementation is complete and satisfactory:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has concerns, requests changes, or identifies failures, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the complete implementation.\n7. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.${getSummaryLogInstructions('implement-feature', doneFile, specDirPath)}`
  },
  {
    name: 'create-test-cases',
    description: 'Generate E2E test cases from a build plan',
    filesDir: (specDirPath) => `${specDirPath}/build_plans`,
    agentFile: (specDirPath) => `${specDirPath}/agents/qa-team-lead.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, please create E2E test cases for the following build plan:\n\n${targetFile}\n\nFollow the template at ${specDirPath}/templates/test_cases.md and generate up to 20 sanity-level test cases that validate core flows and interactions between touched components.\n\nIMPORTANT: Save the test cases in the directory: ${specDirPath}/test_cases/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the test cases, provide a summary of the test coverage and priority distribution.\n2. Ask if any critical scenarios are missing or if existing test cases need refinement.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with these test cases? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has concerns or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the test cases.${getSummaryLogInstructions('create-test-cases', doneFile, specDirPath)}`
  },
  {
    name: 'run-e2e-tests',
    description: 'Generate, run, and diagnose E2E tests from test cases',
    filesDir: (specDirPath) => `${specDirPath}/test_cases`,
    agentFile: (specDirPath) => `${specDirPath}/agents/e2e-engineer.md`,
    promptTemplate: (agentFile, targetFile, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, please implement and execute E2E tests for the following test cases:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the agent profile. Read rnd/instructions/e2e-testing.instructions.md before starting. Start required services, run tests sequentially, diagnose failures, and generate a comprehensive result report.\n\nTest results should be saved to: ${specDirPath}/e2e_results/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After executing tests and generating the result report, provide a summary of test outcomes and failure categories.\n2. Ask if any failures need deeper investigation or if test methodology needs adjustment.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with the E2E test execution and results? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction:\n   a. First, create a summary log of this interaction (see instructions below)\n   b. Then create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user requests re-runs, additional diagnosis, or test updates, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the E2E test results.\n7. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.${getSummaryLogInstructions('run-e2e-tests', doneFile, specDirPath)}`
  },
  {
    name: 'create-retro-report',
    description: 'Review PR discussions and create a retro report',
    filesDir: null, // No file selection - uses free text input (PR number or URL)
    agentFile: (specDirPath) => `${specDirPath}/agents/retro.md`,
    useFreeTextInput: true,
    promptTemplate: (agentFile, userInput, specDirPath) =>
      `Using the ${agentFile} agent profile as instructions, \n\nFollow the template at ${specDirPath}/templates/retro.md and ensure all sections are properly filled out. Analyze review comments, review threads, and issue comments to identify improvements to agents, templates, or instructions.\n\nIMPORTANT: Before analyzing the PR, read all agent summary logs from ${specDirPath}/agent_summaries/ to understand what happened during the development process. These logs contain summaries of agent interactions and will provide context about the workflow that led to this PR.\n\nSave the retro report in: ${specDirPath}/retros/`,
    interactiveSuffix: (doneFile, specDirPath) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. First, read all files in ${specDirPath}/agent_summaries/ to understand the development process.\n2. Then review the PR discussion and comments.\n3. After completing the retro report, provide a summary of the key findings and recommendations.\n4. Ask if any areas need further analysis or if additional recommendations should be included.\n5. After each of your responses, explicitly ask the user: "Are you satisfied with this retro report? (yes/no)"\n6. If the user responds "yes" or confirms satisfaction:\n   a. Create a file named "${doneFile}" in the current directory to signal completion.\n   b. After creating the done file, DELETE ALL FILES in ${specDirPath}/agent_summaries/ to clean up for the next development cycle.\n7. If the user has follow-up questions or requests changes, address them and repeat step 5.\n8. Continue this iterative process until the user is satisfied with the retro report.`
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
