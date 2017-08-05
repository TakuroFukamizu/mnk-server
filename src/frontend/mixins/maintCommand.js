// Mixin for search
import {Xhr} from 'base/axios'

class MaintCommand {
    constructor() {
        this.methods = {
            maintCommandLoadSeq : () => this.loadSeq(),
            maintCommandFrontOff : () => this.frontOff(),
            maintCommandRearOff : () => this.rearOff(),
            maintCommandChangeDocId: (docId) => this.changeDocId(docId),
            maintCommandCheckStatus : () => this.checkStatus(),
        }
    }
    checkStatus() {
        let url = '/_api/status';
        let options = null;
        return new Promise((resolve, reject) => {
            Xhr.get(url, options, (response) => {
                console.log(response.data);
                //{ isChildProcessRun, isMqttConnected, isSeqDataApplied, inProgressSeq, sendedSeqCount, totalSeqCount }
                resolve(response.data);
            }, (error) => {
                console.error(error);
                let message = error.response.data.message || error.response.statusText || error.message || error;
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
    changeDocId(docId) {
        let url = '/_api/changeDocId';
        let options = {
            params: {
                docId: docId
            }
        };
        return this._sendApi(url, options);
    }
    loadSeq() {
        let url = '/_api/loadSeq';
        return this._sendApi(url);
    }
    _sendApi(url, options = null) {
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

export default new MaintCommand();