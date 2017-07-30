
export default class MqttData {
    deviceId: string;
    command: PlayerCommand | ESPrCommand; 

    static PlayerId = "player";

    constructor() {

    }

    static PlayerPlay() {
        let data = new MqttData();
        data.deviceId = MqttData.PlayerId;
        data.command = PlayerCommand.Play;
        return data;
    }

    toJson() {
        return JSON.stringify({ 
            d: { 
                deviceId: this.deviceId, 
                tcommand: this.command 
            }
        });
    }
}

type PlayerCommand = "play" | "pause" | "reset";
namespace PlayerCommand{
    export const Play: PlayerCommand = "play"
    export const Pause: PlayerCommand = "pause"
    export const Reset: PlayerCommand = "reset"
}

type ESPrCommand = "high" | "low" | "off";
namespace ESPrCommand{
    export const High: ESPrCommand = "high"
    export const Low: ESPrCommand = "low"
    export const Off: ESPrCommand = "off"
}
