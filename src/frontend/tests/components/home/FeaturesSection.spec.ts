import { mount } from '@vue/test-utils';
import { vuetify } from '../../setup';
import FeaturesSection from '@/components/home/FeaturesSection.vue';

describe('FeaturesSection', () => {
  const mountComponent = () => {
    return mount(FeaturesSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders all 5 feature cards', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 5; i++) {
      expect(wrapper.find(`[data-test-id="feature-card-${i}"]`).exists()).toBe(true);
    }
  });

  it('each card has title and description', () => {
    const wrapper = mountComponent();
    const expectedTitles = [
      'Out-of-the-box Personas',
      'End-to-end Multi-stage Workflow',
      'Clear R&D Artifact Structure',
      'Real Application Structure',
      'Repo-wide & Path-specific Copilot Rules'
    ];

    for (let i = 0; i < 5; i++) {
      const card = wrapper.find(`[data-test-id="feature-card-${i}"]`);
      expect(card.text()).toContain(expectedTitles[i]);
    }
  });

  it('contains data-test-id="features-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="features-section"]').exists()).toBe(true);
  });

  it('contains data-test-id for each feature card', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 5; i++) {
      expect(wrapper.find(`[data-test-id="feature-card-${i}"]`).exists()).toBe(true);
    }
  });
});
