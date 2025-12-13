import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import router from './router';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
const vuetify = createVuetify();

app.use(pinia);
app.use(vuetify);
app.use(router);

app.mount('#app');
