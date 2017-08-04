
import {PlayerCommand, ESPrCommand, TargetDevice} from './defines';
import MqttData from './model/mqttData';
import {connect, MqttClient} from 'mqtt';

export class MqttManager {
    brokerUrl: string;
    client: MqttClient;
    topic: string = "mononoke";
    onConnectEvent: MqttManagerEventCallback;

    constructor(brokerUrl: string) {
        this.brokerUrl;
    }
    connect() {
        this.client = connect(this.brokerUrl);
        this.client.on('connect', () => {
            if (this.onConnectEvent) this.onConnectEvent();
        });
        // client.on('message', function (topic, message) {
        //     // message is Buffer 
        //     console.log(message.toString())
        //     client.end()
        // });
    }
    send(message: MqttData) {
        this.client.publish(message.topic, message.toJson());
    }
    sendCommadPlayer(command: PlayerCommand) {
        let mqMsg: MqttData;
        switch (command) {
            case PlayerCommand.Play: mqMsg = MqttData.PlayerPlay(); break;
            case PlayerCommand.Pause: mqMsg = MqttData.PlayerPause(); break;
            case PlayerCommand.Reset: mqMsg = MqttData.PlayerReset(); break;
        }
        console.log("sendCommadPlayer", mqMsg.toJson());
        this.client.publish(this.topic, mqMsg.toJson());
    }
    sendCommandESPr(target: TargetDevice, command: ESPrCommand) {
        let mqMsg: MqttData;
        switch (target) {
            case TargetDevice.Front: mqMsg = MqttData.ESPrFront(command); break;
            case TargetDevice.Rear: mqMsg = MqttData.ESPrRear(command); break;
        }
        console.log("sendCommadESPr", mqMsg.toJson());
        this.client.publish(this.topic, mqMsg.toJson());
    }
}

export interface MqttManagerEventCallback {
    () : void;
}
