import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import GreetingCard from '../../../src/frontend/src/components/GreetingCard.vue';

const vuetify = createVuetify({
  components,
  directives
});

describe('GreetingCard', () => {
  it('should render loading state', () => {
    const wrapper = mount(GreetingCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        greeting: null,
        fact: null,
        loading: true,
        error: null
      }
    });

    expect(wrapper.find('[data-test-id="greeting-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="greeting-text"]').exists()).toBe(false);
  });

  it('should render error state', () => {
    const wrapper = mount(GreetingCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        greeting: null,
        fact: null,
        loading: false,
        error: 'Test error message'
      }
    });

    const errorElement = wrapper.find('[data-test-id="greeting-error"]');
    expect(errorElement.exists()).toBe(true);
    expect(errorElement.text()).toContain('Test error message');
  });

  it('should render greeting and fact when loaded', () => {
    const mockFact = {
      text: 'Test fact text',
      language: 'en',
      source: 'test source',
      permalink: 'http://test.com'
    };

    const wrapper = mount(GreetingCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        greeting: 'Hello from R3ND',
        fact: mockFact,
        loading: false,
        error: null
      }
    });

    expect(wrapper.find('[data-test-id="greeting-text"]').text()).toBe('Hello from R3ND');
    expect(wrapper.find('[data-test-id="greeting-fact-text"]').text()).toBe('Test fact text');
    expect(wrapper.find('[data-test-id="greeting-fact-link"]').attributes('href')).toBe('http://test.com');
  });

  it('should not render fact if not provided', () => {
    const wrapper = mount(GreetingCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        greeting: 'Hello',
        fact: null,
        loading: false,
        error: null
      }
    });

    expect(wrapper.find('[data-test-id="greeting-text"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="greeting-fact-text"]').exists()).toBe(false);
  });
});
