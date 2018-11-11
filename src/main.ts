import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";

Vue.config.productionTip = false;
Vue.config.ignoredElements = ["paper-range-slider"];

new Vue({
  render: h => h(App)
}).$mount("#app");
