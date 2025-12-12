import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import HomeView from '../../../src/frontend/src/views/HomeView.vue';
import { useGreetingStore } from '../../../src/frontend/src/stores/useGreetingStore';

const vuetify = createVuetify({
  components,
  directives
});

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should call fetchGreeting on mount', () => {
    const store = useGreetingStore();
    const fetchSpy = jest.spyOn(store, 'fetchGreeting').mockResolvedValue();

    mount(HomeView, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should call fetchGreeting when refresh button clicked', async () => {
    const store = useGreetingStore();
    const fetchSpy = jest.spyOn(store, 'fetchGreeting').mockResolvedValue();

    const wrapper = mount(HomeView, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    });

    const refreshBtn = wrapper.find('[data-test-id="refresh-greeting-btn"]');
    expect(refreshBtn.exists()).toBe(true);

    fetchSpy.mockClear();
    await refreshBtn.trigger('click');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should pass store props to GreetingCard', () => {
    const store = useGreetingStore();
    store.greeting = 'Test greeting';
    store.loading = false;
    store.error = null;

    const wrapper = mount(HomeView, {
      global: {
        plugins: [vuetify, createPinia()]
      }
    });

    const greetingCard = wrapper.findComponent({ name: 'GreetingCard' });
    expect(greetingCard.exists()).toBe(true);
  });
});
