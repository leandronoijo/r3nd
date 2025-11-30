<script setup lang="ts">
import { ref } from 'vue';

interface QuickStartStep {
  title: string;
  command: string;
}

const steps: QuickStartStep[] = [
  {
    title: 'Clone repository:',
    command: 'git clone https://github.com/your-org/your-repo.git'
  },
  {
    title: 'Customize your stack rules:',
    command: '# Edit .github/copilot-instructions.md\n# Edit .github/instructions/*.instructions.md'
  },
  {
    title: 'Add your application code:',
    command: '# Place code under src/ and tests/'
  },
  {
    title: 'Start a feature:',
    command: '# Create a GitHub Issue describing your feature\n# The pipeline will automatically begin'
  }
];

const copiedIndex = ref<number | null>(null);

async function copyToClipboard(command: string, index: number): Promise<void> {
  try {
    await navigator.clipboard.writeText(command);
    copiedIndex.value = index;
    setTimeout(() => {
      copiedIndex.value = null;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}
</script>

<template>
  <v-container data-test-id="quickstart-section" class="py-12">
    <h2 class="text-h4 text-center mb-8">Quick Start</h2>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card
          v-for="(step, index) in steps"
          :key="step.title"
          :data-test-id="`quickstart-step-${index}`"
          class="mb-4"
          elevation="2"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <span>{{ step.title }}</span>
            <v-btn
              :data-test-id="`copy-button-${index}`"
              icon
              variant="text"
              size="small"
              @click="copyToClipboard(step.command, index)"
            >
              <v-icon>{{ copiedIndex === index ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ copiedIndex === index ? 'Copied!' : 'Copy to clipboard' }}
              </v-tooltip>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <pre class="code-block"><code>{{ step.command }}</code></pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.code-block {
  background-color: rgba(var(--v-theme-surface-variant), 0.8);
  border-radius: 4px;
  padding: 12px 16px;
  overflow-x: auto;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
