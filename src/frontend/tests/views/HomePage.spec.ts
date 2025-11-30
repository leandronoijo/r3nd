import { mount } from '@vue/test-utils';
import { vuetify } from '../setup';
import HomePage from '@/views/HomePage.vue';
import HeroSection from '@/components/home/HeroSection.vue';
import FeaturesSection from '@/components/home/FeaturesSection.vue';
import DifferentiatorsSection from '@/components/home/DifferentiatorsSection.vue';
import PipelineSection from '@/components/home/PipelineSection.vue';
import QuickStartSection from '@/components/home/QuickStartSection.vue';
import CtaSection from '@/components/home/CtaSection.vue';

describe('HomePage', () => {
  const mountComponent = () => {
    return mount(HomePage, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders without errors', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('contains all 6 section components', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent(HeroSection).exists()).toBe(true);
    expect(wrapper.findComponent(FeaturesSection).exists()).toBe(true);
    expect(wrapper.findComponent(DifferentiatorsSection).exists()).toBe(true);
    expect(wrapper.findComponent(PipelineSection).exists()).toBe(true);
    expect(wrapper.findComponent(QuickStartSection).exists()).toBe(true);
    expect(wrapper.findComponent(CtaSection).exists()).toBe(true);
  });

  it('contains data-test-id="homepage"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="homepage"]').exists()).toBe(true);
  });

  it('sections render in correct order', () => {
    const wrapper = mountComponent();
    const html = wrapper.html();
    
    const heroIndex = html.indexOf('data-test-id="hero-section"');
    const featuresIndex = html.indexOf('data-test-id="features-section"');
    const differentiatorsIndex = html.indexOf('data-test-id="differentiators-section"');
    const pipelineIndex = html.indexOf('data-test-id="pipeline-section"');
    const quickstartIndex = html.indexOf('data-test-id="quickstart-section"');
    const ctaIndex = html.indexOf('data-test-id="cta-section"');

    expect(heroIndex).toBeLessThan(featuresIndex);
    expect(featuresIndex).toBeLessThan(differentiatorsIndex);
    expect(differentiatorsIndex).toBeLessThan(pipelineIndex);
    expect(pipelineIndex).toBeLessThan(quickstartIndex);
    expect(quickstartIndex).toBeLessThan(ctaIndex);
  });
});
