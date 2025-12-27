const { detectAvailableTools, getAvailableToolNames, getMissingToolNames, getInstallInstructions } = require('../lib/utils/toolDetector');

function register(program) {
  program
    .command('tools')
    .description('Show available and missing AI agent tools')
    .action(async () => {
      try {
        await showToolStatus();
      } catch (err) {
        console.error('Error checking tools:', err && err.message ? err.message : err);
        process.exit(1);
      }
    });
}

async function showToolStatus() {
  console.log('\n🔍 Checking AI Agent Tools...\n');
  
  const tools = detectAvailableTools(true); // Force refresh
  const available = getAvailableToolNames();
  const missing = getMissingToolNames();
  
  if (available.length > 0) {
    console.log('✅ Available tools:');
    available.forEach(tool => {
      console.log(`   • ${tool}`);
    });
  } else {
    console.log('⚠️  No AI agent tools detected.');
  }
  
  if (missing.length > 0) {
    console.log('\n❌ Missing tools:');
    missing.forEach(tool => {
      const cleanToolName = tool.replace(' (GitHub CLI)', '');
      console.log(`   • ${tool}`);
      console.log(`     ${getInstallInstructions(cleanToolName)}`);
    });
  }
  
  console.log('\n💡 Tip: You can still use r3nd without these tools by selecting');
  console.log('   "Generate prompts" option to get AI prompts for manual use.\n');
  
  console.log('📚 For more information, see: cli/README.md\n');
}

module.exports = { register, showToolStatus };
