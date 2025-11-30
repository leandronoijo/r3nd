<script setup lang="ts">
interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: 'mdi-account-group',
    title: 'Out-of-the-box Personas',
    description: 'Four Copilot personas (Product Manager, Architect, Team Lead, Developer) with strict roles and designated output paths.'
  },
  {
    icon: 'mdi-sitemap',
    title: 'End-to-end Multi-stage Workflow',
    description: 'A chained pipeline: Product Spec → Tech Spec → Build Plan → Code, with human-controlled PR gates at every stage.'
  },
  {
    icon: 'mdi-folder-outline',
    title: 'Clear R&D Artifact Structure',
    description: 'Complete traceability under rnd/: product_specs, tech_specs, build_plans, history.'
  },
  {
    icon: 'mdi-code-braces',
    title: 'Real Application Structure',
    description: 'Application code under src/ and tests under tests/, modified only by the Developer persona.'
  },
  {
    icon: 'mdi-cog-outline',
    title: 'Repo-wide & Path-specific Copilot Rules',
    description: 'Define stack-specific rules via .github/instructions without touching personas.'
  }
];
</script>

<template>
  <v-container data-test-id="features-section" class="py-12">
    <h2 class="text-h4 text-center mb-8">What This Project Provides</h2>
    <v-row>
      <v-col
        v-for="(feature, index) in features"
        :key="feature.title"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          :data-test-id="`feature-card-${index}`"
          class="h-100"
          elevation="2"
        >
          <v-card-item>
            <template #prepend>
              <v-icon :icon="feature.icon" size="40" color="primary" />
            </template>
            <v-card-title class="text-wrap">{{ feature.title }}</v-card-title>
          </v-card-item>
          <v-card-text>{{ feature.description }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Features section styling handled by Vuetify props */
</style>
