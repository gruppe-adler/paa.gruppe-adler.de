import Vue from 'vue';
import App from './App.vue';
import VueGtag from 'vue-gtag';
import './registerServiceWorker';

Vue.config.productionTip = false;

Vue.use(VueGtag, { config: { id: 'UA-58235044-5' } });

new Vue({
    render: h => h(App)
}).$mount('#app');
