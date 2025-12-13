import { mount } from '@vue/test-utils';
import GreetingCard from './GreetingCard.vue';

describe('GreetingCard', () => {
  it('should render loading state', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: null,
        fact: null,
        loading: true,
        error: null,
      },
    });

    expect(wrapper.find('[data-test-id="greeting-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="greeting-text"]').exists()).toBe(false);
  });

  it('should render error state', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: null,
        fact: null,
        loading: false,
        error: 'Test error',
      },
    });

    const errorEl = wrapper.find('[data-test-id="greeting-error"]');
    expect(errorEl.exists()).toBe(true);
    expect(errorEl.text()).toContain('Test error');
  });

  it('should render greeting and fact', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: 'Hello from R3ND',
        fact: {
          text: 'Test fact',
          language: 'en',
          source: 'test',
          permalink: 'http://test.com',
        },
        loading: false,
        error: null,
      },
    });

    expect(wrapper.find('[data-test-id="greeting-text"]').text()).toBe('Hello from R3ND');
    expect(wrapper.find('[data-test-id="greeting-fact-text"]').text()).toBe('Test fact');
    
    const link = wrapper.find('[data-test-id="greeting-fact-link"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('http://test.com');
  });

  it('should not render fact section when fact is null', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: 'Hello from R3ND',
        fact: null,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.find('[data-test-id="greeting-text"]').text()).toBe('Hello from R3ND');
    expect(wrapper.find('[data-test-id="greeting-fact-text"]').exists()).toBe(false);
  });
});
