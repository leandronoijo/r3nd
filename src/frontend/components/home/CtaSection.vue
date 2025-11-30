<script setup lang="ts">
// CtaSection - Call-to-action buttons for the welcome page
</script>

<template>
  <v-container data-test-id="cta-section" class="py-16">
    <v-row justify="center">
      <v-col cols="auto" class="d-flex flex-column flex-sm-row ga-4">
        <v-btn
          data-test-id="cta-get-started"
          href="https://github.com/your-org/your-repo#readme"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          size="large"
          variant="elevated"
        >
          Get Started
        </v-btn>
        <v-btn
          data-test-id="cta-documentation"
          href="https://github.com/your-org/your-repo/tree/main/docs"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          size="large"
          variant="tonal"
        >
          View Documentation
        </v-btn>
        <v-btn
          data-test-id="cta-contribute"
          href="https://github.com/your-org/your-repo/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          size="large"
          variant="outlined"
        >
          Contribute
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* CTA section styling handled by Vuetify props */
</style>
