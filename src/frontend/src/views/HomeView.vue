<template>
  <v-container data-test-id="home-view">
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1>Welcome to R3ND</h1>
          <v-btn
            color="primary"
            data-test-id="refresh-greeting-btn"
            @click="handleRefresh"
            :loading="store.loading"
          >
            Refresh
          </v-btn>
        </div>
        
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

function handleRefresh() {
  store.fetchGreeting();
}
</script>
