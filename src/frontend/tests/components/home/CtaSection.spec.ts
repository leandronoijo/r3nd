import { mount } from '@vue/test-utils';
import { vuetify } from '../../setup';
import CtaSection from '@/components/home/CtaSection.vue';

describe('CtaSection', () => {
  const mountComponent = () => {
    return mount(CtaSection, {
      global: {
        plugins: [vuetify]
      }
    });
  };

  it('renders 3 CTA buttons', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="cta-get-started"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="cta-documentation"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="cta-contribute"]').exists()).toBe(true);
  });

  it('buttons have correct labels', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="cta-get-started"]').text()).toContain('Get Started');
    expect(wrapper.find('[data-test-id="cta-documentation"]').text()).toContain('View Documentation');
    expect(wrapper.find('[data-test-id="cta-contribute"]').text()).toContain('Contribute');
  });

  it('buttons have href attributes', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="cta-get-started"]').attributes('href')).toBeDefined();
    expect(wrapper.find('[data-test-id="cta-documentation"]').attributes('href')).toBeDefined();
    expect(wrapper.find('[data-test-id="cta-contribute"]').attributes('href')).toBeDefined();
  });

  it('contains data-test-id="cta-section"', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="cta-section"]').exists()).toBe(true);
  });

  it('contains all required data-test-id attributes', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-id="cta-section"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="cta-get-started"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="cta-documentation"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="cta-contribute"]').exists()).toBe(true);
  });
});
