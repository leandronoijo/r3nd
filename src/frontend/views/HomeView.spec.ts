import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import HomeView from './HomeView.vue';
import { useGreetingStore } from '../stores/useGreetingStore';

describe('HomeView', () => {
  it('should call fetchGreeting on mount', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createTestingPinia({ createSpy: jest.fn })],
      },
    });

    const store = useGreetingStore();
    expect(store.fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it('should call fetchGreeting when refresh button clicked', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createTestingPinia({ createSpy: jest.fn })],
      },
    });

    const store = useGreetingStore();
    (store.fetchGreeting as jest.Mock).mockClear();

    const refreshBtn = wrapper.find('[data-test-id="refresh-greeting-btn"]');
    await refreshBtn.trigger('click');

    expect(store.fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it('should pass store state to GreetingCard', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: jest.fn,
            initialState: {
              greeting: {
                greeting: 'Test greeting',
                fact: { text: 'Test fact', language: 'en', source: 'test', permalink: 'http://test.com' },
                loading: false,
                error: null,
              },
            },
          }),
        ],
      },
    });

    const card = wrapper.findComponent({ name: 'GreetingCard' });
    expect(card.exists()).toBe(true);
    expect(card.props('greeting')).toBe('Test greeting');
    expect(card.props('fact')).toEqual({ text: 'Test fact', language: 'en', source: 'test', permalink: 'http://test.com' });
  });
});
