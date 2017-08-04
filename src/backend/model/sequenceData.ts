
import {PlayerCommand, ESPrCommand, TargetDevice} from '../defines';
import MqttData from './mqttData';

export default class SequenceData {
    topic: string;
    timeline: number;
    deviceId: TargetDevice;
    command: ESPrCommand;
    data: any;
    comment: string;

    executed: boolean;

    constructor(topic: string, timeline: number, deviceId: TargetDevice, command: ESPrCommand, data: any = null, comment:string = "") {
        this.topic = topic;
        this.timeline = timeline;
        this.deviceId = deviceId;
        this.command = command
        this.data = data;
        this.comment = comment;

        this.executed = false;
    }

    static fromAny(rowObject: Array<any>) {
        let topic = rowObject[0];
        let timeline = parseFloat(rowObject[1]) * 1000; // sec to ms
        let deviceId = rowObject[2]
        let command = rowObject[3];
        let data = rowObject[4];
        let comment = rowObject[5];
        return new SequenceData(topic, timeline, deviceId, command, data, comment)
    }

    toMqttObject() {
        let mqtt = new MqttData(this.deviceId, this.command);
        mqtt.topic = this.topic;
        return mqtt
    }
}