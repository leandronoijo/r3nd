<script setup lang="ts">
interface Differentiator {
  icon: string;
  title: string;
  description: string;
}

const differentiators: Differentiator[] = [
  {
    icon: 'mdi-shield-check',
    title: 'Human-in-the-loop Safety',
    description: 'No code is merged without human review. Every PR gate requires approval.'
  },
  {
    icon: 'mdi-target',
    title: 'Deterministic Persona Behavior',
    description: 'Each persona has a narrow scope and cannot spill into other roles.'
  },
  {
    icon: 'mdi-link-variant',
    title: 'Full Traceability',
    description: 'Every feature produces a complete chain: Product Spec → Tech Spec → Build Plan → Code.'
  },
  {
    icon: 'mdi-puzzle-outline',
    title: 'Technology Independence',
    description: 'The template does not assume any language or framework. All tech constraints live in your .github/instructions files.'
  }
];
</script>

<template>
  <v-container data-test-id="differentiators-section" class="py-12">
    <h2 class="text-h4 text-center mb-8">Why Choose This Seed Project</h2>
    <v-row>
      <v-col
        v-for="(diff, index) in differentiators"
        :key="diff.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <v-card
          :data-test-id="`differentiator-card-${index}`"
          class="h-100"
          elevation="2"
        >
          <v-card-item>
            <template #prepend>
              <v-icon :icon="diff.icon" size="40" color="primary" />
            </template>
            <v-card-title class="text-wrap">{{ diff.title }}</v-card-title>
          </v-card-item>
          <v-card-text>{{ diff.description }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Differentiators section styling handled by Vuetify props */
</style>
