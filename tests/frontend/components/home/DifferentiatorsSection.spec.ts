import { mount } from '@vue/test-utils';
import { vuetify } from '../../../setup';
import DifferentiatorsSection from '@/components/home/DifferentiatorsSection.vue';

describe('DifferentiatorsSection', () => {
  const mountComponent = () => {
    return mount(DifferentiatorsSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders all 4 differentiator cards', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 4; i++) {
      expect(wrapper.find(`[data-test-id="differentiator-card-${i}"]`).exists()).toBe(true);
    }
  });

  it('each card has title and description', () => {
    const wrapper = mountComponent();
    const expectedTitles = [
      'Human-in-the-loop Safety',
      'Deterministic Persona Behavior',
      'Full Traceability',
      'Technology Independence'
    ];

    for (let i = 0; i < 4; i++) {
      const card = wrapper.find(`[data-test-id="differentiator-card-${i}"]`);
      expect(card.text()).toContain(expectedTitles[i]);
    }
  });

  it('contains data-test-id="differentiators-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="differentiators-section"]').exists()).toBe(true);
  });

  it('contains data-test-id for each differentiator card', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 4; i++) {
      expect(wrapper.find(`[data-test-id="differentiator-card-${i}"]`).exists()).toBe(true);
    }
  });
});
