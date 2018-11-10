import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";

Vue.config.productionTip = false;
Vue.config.ignoredElements = ["paper-range-slider"];

new Vue({
  render: h => h(App)
}).$mount("#app");

// @ts-ignore
// const piWorker = new Worker("./worker.ts", { type: "module" });

// piWorker.onmessage = (event: any) => {
//   console.log("pi: " + event.data);
// };
// piWorker.postMessage(42);
