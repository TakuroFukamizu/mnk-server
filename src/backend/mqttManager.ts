
import {PlayerCommand, ESPrCommand, TargetDevice} from './defines';
import MqttData from './model/mqttData';
import {connect, MqttClient, IClientOptions} from 'mqtt';
import {Config} from './config';

export class MqttManager {
    brokerUrl: string;
    user: string;
    pass: string;
    client: MqttClient;
    topic: string = "mononoke";
    onConnectEvent: MqttManagerEventCallback;

    constructor(brokerUrl: string, user: string, pass: string) {
        this.brokerUrl = brokerUrl;
        this.user = user;
        this.pass = pass;
    }
    connect() {
        let client = connect(this.brokerUrl, { username: this.user, password: this.pass });
        
        client.on('connect', () => {
            if (this.onConnectEvent) this.onConnectEvent();
        });
        client.on('reconnect', () => {
            console.info('mqtt reconnect');
        });
        client.on('close', () => {
            console.info('mqtt close');
        });
        client.on('error', (error) => {
            console.error('mqtt error', error);
        });
        
        // client.on('message', function (topic, message) {
        //     // message is Buffer 
        //     console.log(message.toString())
        //     client.end()
        // });
        // TODO: disconnectを検知
        this.client = client;
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
        if (Config.DEBUG) console.log("sendCommadPlayer", mqMsg.toJson());
        this.client.publish(this.topic, mqMsg.toJson());
    }
    sendCommandESPr(target: TargetDevice, command: ESPrCommand) {
        let mqMsg: MqttData;
        switch (target) {
            case TargetDevice.Front: mqMsg = MqttData.ESPrFront(command); break;
            case TargetDevice.Rear: mqMsg = MqttData.ESPrRear(command); break;
        }
        if (Config.DEBUG) console.log("sendCommadESPr", mqMsg.toJson());
        this.client.publish(this.topic, mqMsg.toJson());
    }
}

export interface MqttManagerEventCallback {
    () : void;
}
