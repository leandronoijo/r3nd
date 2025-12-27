/**
 * Agent Registry - Declarative configuration for agent commands
 * 
 * Each agent entry defines:
 * - name: command name (e.g., 'tech-spec' becomes 'r3nd agents tech-spec')
 * - description: help text for the command
 * - filesDir: relative directory to scan for input files
 * - agentFile: path to the agent profile markdown file
 * - promptTemplate: function that generates the prompt text
 */

const AGENT_REGISTRY = [
  {
    name: 'product-spec',
    description: 'Generate a product specification from a feature description',
    filesDir: null, // No file selection - uses free text input
    agentFile: '.github/agents/product-manager.agent.md',
    useFreeTextInput: true,
    promptTemplate: (agentFile, userInput) => 
      `Using the ${agentFile} agent profile as instructions, please create a product specification for the following feature description:\n\n${userInput}\n\nFollow the template at .github/templates/product_spec.md and ensure all sections are properly filled out. Generate an appropriate feature-id based on the description.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the product specification, provide a summary of the document you created.\n2. Ask if there are any sections that need clarification or additional detail.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this product specification? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the product specification.`
  },
  {
    name: 'tech-spec',
    description: 'Generate a technical specification from a product spec',
    filesDir: 'rnd/product_specs',
    agentFile: '.github/agents/architect.agent.md',
    promptTemplate: (agentFile, targetFile) => 
      `Using the ${agentFile} agent profile as instructions, please create a technical specification for the following product spec:\n\n${targetFile}\n\nFollow the template at .github/templates/tech_spec.md and ensure all sections are properly filled out.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the technical specification, provide a summary highlighting the key technical decisions and architecture.\n2. Ask if there are any technical aspects that need further elaboration or alternative approaches to consider.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this technical specification? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the technical specification.`
  },
  {
    name: 'build-plan',
    description: 'Generate a build plan from a technical specification',
    filesDir: 'rnd/tech_specs',
    agentFile: '.github/agents/team-lead.agent.md',
    promptTemplate: (agentFile, targetFile) =>
      `Using the ${agentFile} agent profile as instructions, please create a build plan for the following technical specification:\n\n${targetFile}\n\nFollow the template at .github/templates/build_plan.md and break down the work into atomic, testable tasks.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the build plan, provide a summary of the tasks and estimated complexity.\n2. Ask if any tasks need to be broken down further or if dependencies are clear.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with this build plan? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has follow-up questions or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the build plan.`
  },
  {
    name: 'develop',
    description: 'Implement a build plan to completion',
    filesDir: 'rnd/build_plans',
    agentFile: '.github/agents/developer.agent.md',
    promptTemplate: (agentFile, targetFile) =>
      `Using the ${agentFile} agent profile as instructions, please implement the following build plan to its completion:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the agent profile. Read instruction files before starting. Test as you implement. Mark tasks complete as you finish them.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After implementing each major task or checkpoint, provide a summary of what was completed and any issues encountered.\n2. Ask if there are any concerns about the implementation or if testing reveals problems.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with the current implementation progress? (yes/no)"\n4. If the user responds "yes" or confirms the implementation is complete and satisfactory, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has concerns, requests changes, or identifies bugs, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the complete implementation.\n7. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.`
  },
  {
    name: 'test-cases',
    description: 'Generate E2E test cases from a build plan',
    filesDir: 'rnd/build_plans',
    agentFile: '.github/agents/qa-team-lead.agent.md',
    promptTemplate: (agentFile, targetFile) =>
      `Using the ${agentFile} agent profile as instructions, please create E2E test cases for the following build plan:\n\n${targetFile}\n\nFollow the template at .github/templates/test_cases.md and generate up to 20 sanity-level test cases that validate core flows and interactions between touched components.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After completing the test cases, provide a summary of the test coverage and priority distribution.\n2. Ask if any critical scenarios are missing or if existing test cases need refinement.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with these test cases? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user has concerns or requests changes, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the test cases.`
  },
  {
    name: 'e2e-tests',
    description: 'Generate, run, and diagnose E2E tests from test cases',
    filesDir: 'rnd/test_cases',
    agentFile: '.github/agents/e2e-engineer.agent.md',
    promptTemplate: (agentFile, targetFile) =>
      `Using the ${agentFile} agent profile as instructions, please implement and execute E2E tests for the following test cases:\n\n${targetFile}\n\nIMPORTANT: Follow all rules in the agent profile. Read .github/instructions/e2e-testing.instructions.md before starting. Start required services, run tests sequentially, diagnose failures, and generate a comprehensive result report.`,
    interactiveSuffix: (doneFile) =>
      `\n\nIMPORTANT INSTRUCTIONS FOR INTERACTIVE MODE:\n1. After executing tests and generating the result report, provide a summary of test outcomes and failure categories.\n2. Ask if any failures need deeper investigation or if test methodology needs adjustment.\n3. After each of your responses, explicitly ask the user: "Are you satisfied with the E2E test execution and results? (yes/no)"\n4. If the user responds "yes" or confirms satisfaction, create a file named "${doneFile}" in the current directory to signal completion.\n5. If the user requests re-runs, additional diagnosis, or test updates, address them and repeat step 3.\n6. Continue this iterative process until the user is satisfied with the E2E test results.\n7. Do NOT start any server or docker foreground processes that require manual termination. Always run services in detached/background mode.`
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
  
  if (AGENT_REGISTRY.find(a => a.name === agentConfig.name)) {
    throw new Error(`Agent with name "${agentConfig.name}" is already registered`);
  }
  
  AGENT_REGISTRY.push(agentConfig);
}

module.exports = {
  getAgents,
  getAgent,
  registerAgent
};
