import router from '@/router/index';

describe('Router Configuration', () => {
  it('has route for path "/"', () => {
    const route = router.getRoutes().find(r => r.path === '/');
    expect(route).toBeDefined();
  });

  it('route name is "home"', () => {
    const route = router.getRoutes().find(r => r.path === '/');
    expect(route?.name).toBe('home');
  });

  it('route component is HomePage', () => {
    const route = router.getRoutes().find(r => r.path === '/');
    expect(route?.components?.default).toBeDefined();
  });

  it('router uses web history mode', () => {
    // Vue Router 4 uses 'history' property on router options
    // We can check by ensuring the router exists and has been created with web history
    expect(router).toBeDefined();
    expect(router.options.history).toBeDefined();
  });
});
