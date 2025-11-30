<script setup lang="ts">
interface PipelineStep {
  icon: string;
  title: string;
  description: string;
}

const steps: PipelineStep[] = [
  {
    icon: 'mdi-github',
    title: 'GitHub Issue',
    description: 'Create an issue describing your feature'
  },
  {
    icon: 'mdi-clipboard-text',
    title: 'Product Manager',
    description: 'Generates Product Spec → PR #1'
  },
  {
    icon: 'mdi-drawing',
    title: 'Architect',
    description: 'Generates Tech Spec → PR #2'
  },
  {
    icon: 'mdi-format-list-checks',
    title: 'Team Lead',
    description: 'Generates Build Plan → PR #3'
  },
  {
    icon: 'mdi-code-tags',
    title: 'Developer',
    description: 'Generates Code + Tests → PR #4'
  },
  {
    icon: 'mdi-check-circle',
    title: 'Feature Merged',
    description: 'Human-approved and merged'
  }
];
</script>

<template>
  <v-container data-test-id="pipeline-section" class="py-12">
    <h2 class="text-h4 text-center mb-8">How the Pipeline Works</h2>
    <v-stepper alt-labels non-linear class="bg-transparent elevation-0">
      <v-stepper-header>
        <template v-for="(step, index) in steps" :key="step.title">
          <v-stepper-item
            :data-test-id="`pipeline-step-${index}`"
            :value="index + 1"
            :title="step.title"
            :subtitle="step.description"
            :icon="step.icon"
            :complete="false"
            editable
          />
          <v-divider v-if="index < steps.length - 1" />
        </template>
      </v-stepper-header>
    </v-stepper>
  </v-container>
</template>

<style scoped>
/* Pipeline section styling handled by Vuetify props */
</style>
