import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import HomeView from '../../../src/frontend/src/views/HomeView.vue';
import { useGreetingStore } from '../../../src/frontend/src/stores/useGreetingStore';
import GreetingCard from '../../../src/frontend/src/components/GreetingCard.vue';

describe('HomeView', () => {
  it('should call fetchGreeting on mount', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createTestingPinia({ stubActions: false })],
        stubs: {
          GreetingCard: true,
        },
      },
    });

    const store = useGreetingStore();
    expect(store.fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it('should call fetchGreeting when refresh button is clicked', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createTestingPinia({ stubActions: false })],
        stubs: {
          GreetingCard: true,
        },
      },
    });

    const store = useGreetingStore();
    
    // Clear the mount call
    (store.fetchGreeting as jest.Mock).mockClear();

    const refreshButton = wrapper.find('[data-test-id="refresh-greeting-btn"]');
    await refreshButton.trigger('click');

    expect(store.fetchGreeting).toHaveBeenCalledTimes(1);
  });

  it('should pass store state to GreetingCard', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createTestingPinia({
          initialState: {
            greeting: {
              greeting: 'Test greeting',
              fact: {
                text: 'Test fact',
                language: 'en',
                source: 'test.com',
                permalink: 'https://test.com/fact',
              },
              loading: false,
              error: null,
            },
          },
        })],
      },
    });

    const greetingCard = wrapper.findComponent(GreetingCard);
    expect(greetingCard.exists()).toBe(true);
    expect(greetingCard.props('greeting')).toBe('Test greeting');
    expect(greetingCard.props('fact')).toEqual({
      text: 'Test fact',
      language: 'en',
      source: 'test.com',
      permalink: 'https://test.com/fact',
    });
    expect(greetingCard.props('loading')).toBe(false);
    expect(greetingCard.props('error')).toBeNull();
  });
});
