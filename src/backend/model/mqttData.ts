import {PlayerCommand, ESPrCommand, TargetDevice} from '../defines';

export default class MqttData {
    topic: string;
    deviceId: TargetDevice;
    command: PlayerCommand | ESPrCommand; 

    constructor(deviceId: TargetDevice, command: PlayerCommand | ESPrCommand, topic: string = null) {
        this.topic = topic;
        this.deviceId = deviceId;
        this.command = command;
    }

    static PlayerPlay() {
        return new MqttData(TargetDevice.Player, PlayerCommand.Play);
    }
    static PlayerPause() {
        return new MqttData(TargetDevice.Player, PlayerCommand.Pause);
    }
    static PlayerReset() {
        return new MqttData(TargetDevice.Player, PlayerCommand.Reset);
    }
    static ESPrFront(command: ESPrCommand) {
        return new MqttData(TargetDevice.Front, command);
    }
    static ESPrRear(command: ESPrCommand) {
        return new MqttData(TargetDevice.Rear, command);
    }

    toJson() {
        return JSON.stringify({ 
            d: { 
                deviceId: this.deviceId, 
                command: this.command 
            }
        });
    }
}
