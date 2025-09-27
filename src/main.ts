import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/css/main.css';

const app = createApp(App);
app.use(router);

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', err, info);
};

app.mount('#app');