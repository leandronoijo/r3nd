<script setup lang="ts">
interface Fact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

defineProps<{
  greeting: string | null;
  fact: Fact | null;
  loading: boolean;
  error: string | null;
}>();
</script>

<template>
  <v-card data-test-id="greeting-card" class="mx-auto" max-width="600">
    <v-card-title>R3ND Greeting</v-card-title>
    
    <v-card-text>
      <v-progress-linear
        v-if="loading"
        data-test-id="greeting-loading"
        indeterminate
        color="primary"
      />

      <v-alert
        v-if="error"
        data-test-id="greeting-error"
        type="error"
        class="mb-4"
      >
        {{ error }}
      </v-alert>

      <div v-if="greeting && !loading">
        <p data-test-id="greeting-text" class="text-h6 mb-4">
          {{ greeting }}
        </p>

        <div v-if="fact">
          <v-divider class="my-4" />
          <p class="text-subtitle-2 mb-2">Random Fact:</p>
          <p data-test-id="greeting-fact-text" class="text-body-1 mb-2">
            {{ fact.text }}
          </p>
          <p class="text-caption">
            <strong>Source:</strong> {{ fact.source }} |
            <strong>Language:</strong> {{ fact.language }}
          </p>
          <a
            :href="fact.permalink"
            data-test-id="greeting-fact-link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-caption"
          >
            View original
          </a>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
</style>
