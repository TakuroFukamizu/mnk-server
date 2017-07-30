'use strict';

const mqtt = require('mqtt');

const MqttData = require('./mqttData');

const MQ_URL = 'mqtt://localhost';
const MQ_CH_PLAYER = 'player';

console.log("child start");

let seqData = null;
process.on("message", function (msg) {
    console.log(msg);
    switch(msg) {
        case 'play':
        case 'pause':
        case 'resume':
            sendCommadPlayer('play');
            break;
        default:
            seqData = SequenceData.fromJson(msg);
            console.error('unsupported command');
    }
});

process.on("exit", function () {
    console.log("child exit");
});

class SequenceData {
    constructor() {
        this._list = [];
    }
    static fromJson(json) {
        let instance = new SequenceData();
        return instance;
    }
}

const client = mqtt.connect(MQ_URL);
client.on('connect', function () {
    // client.subscribe('presence')
    process.send({ message: "mqtt.connected" });
});
// client.on('message', function (topic, message) {
//     // message is Buffer 
//     console.log(message.toString())
//     client.end()
// });
function sendCommadPlayer(command) {
    client.publish(MQ_CH_PLAYER, command);
}

