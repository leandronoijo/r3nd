<script setup lang="ts">
import HeroSection from '@/components/home/HeroSection.vue';
import FeaturesSection from '@/components/home/FeaturesSection.vue';
import DifferentiatorsSection from '@/components/home/DifferentiatorsSection.vue';
import PipelineSection from '@/components/home/PipelineSection.vue';
import QuickStartSection from '@/components/home/QuickStartSection.vue';
import CtaSection from '@/components/home/CtaSection.vue';
</script>

<template>
  <div data-test-id="homepage">
    <HeroSection />
    <FeaturesSection />
    <DifferentiatorsSection />
    <PipelineSection />
    <QuickStartSection />
    <CtaSection />
  </div>
</template>

<style scoped>
/* HomePage styling handled by child components */
</style>
