import { mount } from '@vue/test-utils';
import { vuetify } from '../../setup';
import PipelineSection from '@/components/home/PipelineSection.vue';

describe('PipelineSection', () => {
  const mountComponent = () => {
    return mount(PipelineSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders 6 pipeline steps', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 6; i++) {
      expect(wrapper.find(`[data-test-id="pipeline-step-${i}"]`).exists()).toBe(true);
    }
  });

  it('contains data-test-id="pipeline-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="pipeline-section"]').exists()).toBe(true);
  });

  it('contains data-test-id for each pipeline step', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 6; i++) {
      expect(wrapper.find(`[data-test-id="pipeline-step-${i}"]`).exists()).toBe(true);
    }
  });

  it('displays correct step titles', () => {
    const wrapper = mountComponent();
    const expectedTitles = [
      'GitHub Issue',
      'Product Manager',
      'Architect',
      'Team Lead',
      'Developer',
      'Feature Merged'
    ];

    expectedTitles.forEach(title => {
      expect(wrapper.text()).toContain(title);
    });
  });
});
