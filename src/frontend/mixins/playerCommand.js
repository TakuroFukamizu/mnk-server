// Mixin for search
import {Xhr} from 'base/axios'

class PlayerCommand {
    constructor() {
        this.methods = {
            playerCommandPlay : () => this.play(),
            playerCommandPause : () => this.pause(),
            playerCommandReset : () => this.reset(),
        }
    }
    play() {
        let url = '/_api/play';
        return this._sendApi(url);
    }
    pause() {
        let url = '/_api/pause';
        return this._sendApi(url);
    }
    reset() {
        let url = '/_api/reset';
        return this._sendApi(url);
    }
    _sendApi(url) {
        let options = null;
        return new Promise((resolve, reject) => {
            Xhr.get(url, options, (response) => {
                console.log(response);
                try {
                    let command = response.data.command;
                    let status = response.data.status;
                    if (status == "success") {
                        resolve(true);
                    } else {
                        let message = response.data.message;
                        reject(new Error(message))
                    }
                } catch(e) {
                    reject(e);
                }
            }, (error) => {
                console.error(error);
                let message = error.response.data.message || error.response.statusText || error.message || error;
                reject(message);
            });
        });
    }
}

export default new PlayerCommand();