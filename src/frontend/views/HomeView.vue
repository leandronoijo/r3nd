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

<template>
  <v-container data-test-id="home-view" class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" md="8" lg="6">
        <GreetingCard
          :greeting="store.greeting"
          :fact="store.fact"
          :loading="store.loading"
          :error="store.error"
        />
        
        <div class="text-center mt-4">
          <v-btn
            data-test-id="refresh-greeting-btn"
            color="primary"
            @click="refreshGreeting"
            :disabled="store.loading"
          >
            Refresh Greeting
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
</style>
