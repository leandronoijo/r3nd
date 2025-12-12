<template>
  <v-container data-test-id="home-view">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h3">Welcome to R3ND</h1>
          <v-btn
            data-test-id="refresh-greeting-btn"
            color="primary"
            @click="refreshGreeting"
            :loading="store.loading"
          >
            Refresh
          </v-btn>
        </div>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12">
        <GreetingCard
          :greeting="store.greeting"
          :fact="store.fact"
          :loading="store.loading"
          :error="store.error"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGreetingStore } from '../stores/useGreetingStore';
import GreetingCard from '../components/GreetingCard.vue';

const store = useGreetingStore();

onMounted(() => {
  store.fetchGreeting();
});

function refreshGreeting() {
  store.fetchGreeting();
}
</script>

<style scoped>
.v-container {
  padding-top: 2rem;
}
</style>
