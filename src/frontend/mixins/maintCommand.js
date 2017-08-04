// Mixin for search
import {Xhr} from 'base/axios'

class MaintCommand {
    constructor() {
        this.methods = {
            maintCommandLoadSeq : () => this.loadSeq(),
            maintCommandFrontOff : () => this.frontOff(),
            maintCommandRearOff : () => this.rearOff(),
            maintCommandCheckStatus : () => this.checkStatus(),
        }
    }
    checkStatus() {
        let url = '/_api/status';
        let options = null;
        return new Promise((resolve, reject) => {
            Xhr.get(url, options, (response) => {
                console.log(response);
                resolve(response.data);
            }, (error) => {
                switch(error.response.status) {
                    case 403:
                        message = 'API rate limit exceeded'
                        break
                    default:
                        message = error.response.data.message
                }
                reject(message);
            });
        });
    }
    frontOff() {
        let url = '/_api/device/front/off';
        return this._sendApi(url);
    }
    rearOff() {
        let url = '/_api/device/rear/off';
        return this._sendApi(url);
    }
    loadSeq() {
        let url = '/_api/loadSeq';
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
                switch(error.response.status) {
                    case 403:
                        message = 'API rate limit exceeded'
                        break
                    default:
                        message = error.response.data.message
                }
                reject(message);
            });
        });
    }
}

export default new MaintCommand();