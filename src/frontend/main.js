// App Setting
import 'filters.js'
import axios from 'axios'
import routes from 'routes.js'
import VueRouter from 'vue-router'
import VueLocalStorage from 'vue-localstorage'

import App from 'App.vue'

require('es6-promise').polyfill();

require('file-loader?name=[name].[ext]!./index.html');

// Scss/css
import 'stylesheets/bulma.scss'
import 'stylesheets/app.scss'
import 'stylesheets/sk-folding-cube.css'
import 'stylesheets/sk-spinner.css'

// Socket.io
import VueSocketio from 'vue-socket.io';
Vue.use(VueSocketio, 'http://localhost:1923');

// axios
Vue.prototype.$http = axios

Vue.use(VueLocalStorage)

// Vue Routing
Vue.use(VueRouter)
const router = new VueRouter(routes)
new Vue({
  router,
  template: '<App ref="app" />',
  components: {
    'App': App
  }
}).$mount('#app')