// Vue-resource handling
import Settings from 'settings'
export class Xhr {
  static get(url, params = {}, success = null, failure = null) {
    Vue.prototype.$http.get(url, params, { timeout: 240 * 1000 }).then(success).catch(failure)
  }
}