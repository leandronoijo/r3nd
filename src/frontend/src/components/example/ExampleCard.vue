<template>
  <v-card data-test-id="example-card">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <p data-test-id="example-description">{{ description }}</p>
      <v-btn 
        v-if="showAction"
        data-test-id="example-action-btn"
        @click="handleAction"
      >
        Action
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  showAction?: boolean;
}>();

const emit = defineEmits<{
  action: [];
}>();

function handleAction() {
  emit('action');
}
</script>

<style scoped>
.v-card {
  margin: 1rem 0;
}
</style>
