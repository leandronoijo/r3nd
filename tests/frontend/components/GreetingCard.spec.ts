import { mount } from '@vue/test-utils';
import GreetingCard from '../../../src/frontend/src/components/GreetingCard.vue';

describe('GreetingCard', () => {
  const mockFact = {
    text: 'Test fact text',
    language: 'en',
    source: 'test.com',
    permalink: 'https://test.com/fact',
  };

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
  });

  it('should render error state', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: null,
        fact: null,
        loading: false,
        error: 'Test error message',
      },
    });

    const errorAlert = wrapper.find('[data-test-id="greeting-error"]');
    expect(errorAlert.exists()).toBe(true);
    expect(errorAlert.text()).toContain('Test error message');
  });

  it('should render greeting and fact', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: 'Hello from R3ND',
        fact: mockFact,
        loading: false,
        error: null,
      },
    });

    const greetingText = wrapper.find('[data-test-id="greeting-text"]');
    expect(greetingText.exists()).toBe(true);
    expect(greetingText.text()).toBe('Hello from R3ND');

    const factText = wrapper.find('[data-test-id="greeting-fact-text"]');
    expect(factText.exists()).toBe(true);
    expect(factText.text()).toBe('Test fact text');

    const factLink = wrapper.find('[data-test-id="greeting-fact-link"]');
    expect(factLink.exists()).toBe(true);
    expect(factLink.attributes('href')).toBe('https://test.com/fact');
  });

  it('should not render fact when null', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: 'Hello from R3ND',
        fact: null,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.find('[data-test-id="greeting-fact-text"]').exists()).toBe(false);
  });

  it('should not show loading when not loading', () => {
    const wrapper = mount(GreetingCard, {
      props: {
        greeting: 'Hello',
        fact: mockFact,
        loading: false,
        error: null,
      },
    });

    expect(wrapper.find('[data-test-id="greeting-loading"]').exists()).toBe(false);
  });
});
