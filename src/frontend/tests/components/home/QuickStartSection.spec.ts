import { mount } from '@vue/test-utils';
import { vuetify } from '../../setup';
import QuickStartSection from '@/components/home/QuickStartSection.vue';

describe('QuickStartSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mountComponent = () => {
    return mount(QuickStartSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders 4 Quick Start steps', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 4; i++) {
      expect(wrapper.find(`[data-test-id="quickstart-step-${i}"]`).exists()).toBe(true);
    }
  });

  it('each step has a copy button', () => {
    const wrapper = mountComponent();
    for (let i = 0; i < 4; i++) {
      expect(wrapper.find(`[data-test-id="copy-button-${i}"]`).exists()).toBe(true);
    }
  });

  it('copy button triggers clipboard action', async () => {
    const wrapper = mountComponent();
    const copyButton = wrapper.find('[data-test-id="copy-button-0"]');
    await copyButton.trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('git clone https://github.com/your-org/your-repo.git');
  });

  it('contains data-test-id="quickstart-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="quickstart-section"]').exists()).toBe(true);
  });

  it('contains all required data-test-id attributes', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="quickstart-section"]').exists()).toBe(true);
    for (let i = 0; i < 4; i++) {
      expect(wrapper.find(`[data-test-id="quickstart-step-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test-id="copy-button-${i}"]`).exists()).toBe(true);
    }
  });
});
