<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>R3ND Seed</v-toolbar-title>
    </v-app-bar>
    
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>
