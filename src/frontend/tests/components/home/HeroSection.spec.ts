import { mount } from '@vue/test-utils';
import { vuetify } from '../../setup';
import HeroSection from '@/components/home/HeroSection.vue';

describe('HeroSection', () => {
  const mountComponent = () => {
    return mount(HeroSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders headline text "AI-Driven R&D Pipeline"', () => {
    const wrapper = mountComponent();
    const headline = wrapper.find('[data-test-id="hero-headline"]');
    expect(headline.text()).toBe('AI-Driven R&D Pipeline');
  });

  it('renders tagline text', () => {
    const wrapper = mountComponent();
    const tagline = wrapper.find('[data-test-id="hero-tagline"]');
    expect(tagline.text()).toBe('From Idea to Code — Automated, Traceable, Human-Controlled');
  });

  it('contains data-test-id="hero-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="hero-section"]').exists()).toBe(true);
  });

  it('contains data-test-id="hero-headline"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="hero-headline"]').exists()).toBe(true);
  });

  it('contains data-test-id="hero-tagline"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="hero-tagline"]').exists()).toBe(true);
  });
});
