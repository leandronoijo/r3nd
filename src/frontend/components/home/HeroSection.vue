<script setup lang="ts">
// HeroSection - Main headline and tagline for the welcome page
</script>

<template>
  <v-container fluid data-test-id="hero-section" class="py-16">
    <v-row justify="center" align="center">
      <v-col cols="12" class="text-center">
        <h1 class="text-h2 font-weight-bold mb-4" data-test-id="hero-headline">
          AI-Driven R&D Pipeline
        </h1>
        <p class="text-h5 text-medium-emphasis" data-test-id="hero-tagline">
          From Idea to Code — Automated, Traceable, Human-Controlled
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Hero section styling handled by Vuetify props */
</style>
