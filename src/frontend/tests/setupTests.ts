import { config } from '@vue/test-utils';

config.global.stubs = {
  VApp: true,
  VMain: true,
  VCard: true,
  VCardTitle: true,
  VCardText: true,
  VProgressLinear: true,
  VAlert: true,
  VDivider: true,
  VContainer: true,
  VRow: true,
  VCol: true,
  VBtn: true,
  RouterView: true,
};

(globalThis as any).__VITE_API_BASE_URL__ = undefined;
(globalThis as any).__VITE_BASE_URL__ = '/';
