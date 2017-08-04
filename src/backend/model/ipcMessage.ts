export class IpcMessage {
    type: IpcMessageType;
    payload: any;

    constructor(type: IpcMessageType, payload: any = null) {
        this.type = type;
        this.payload = payload;
    }

    static fromAny(object:any) {
        // { type, payload }
        let type: IpcMessageType;
        try {
            type = IpcMessageType.keys.filter((key) => object.type == key.toString() )[0];
        } catch (error) {
            throw new Error("unsupported type");
        }
        // switch(object.type) {
        //     case IpcMessageType.State.toString():
        //         type = IpcMessageType.State;
        //         break;
        //     case IpcMessageType.PlayerCommand.toString():
        //         type = IpcMessageType.PlayerCommand;
        //         break;
        //     case IpcMessageType.SequenceData.toString():
        //         type = IpcMessageType.SequenceData;
        //         break;
        //     case IpcMessageType.Info.toString():
        //         type = IpcMessageType.Info;
        //         break;
        //     default:
        //         throw new Error("unsupported type");
        // }
        let instance = new IpcMessage(type, object.payload || null);
        return instance;
    }
}

export type IpcMessageType = "state" | "command" | "maint" | "data.sequence" | "info";
export namespace IpcMessageType {
    export const State: IpcMessageType = "state"
    export const Command: IpcMessageType = "command"
    export const Maint: IpcMessageType = "maint"
    export const SequenceData: IpcMessageType = "data.sequence"
    export const Info: IpcMessageType = "info"
    export const keys: Array<IpcMessageType> = [State, Command, Maint, SequenceData, Info]
}

export type IpcMaintMessage = "initialize" | "esp.front.off" | "esp.rear.off";
export namespace IpcMaintMessage {
    export const Init: IpcMaintMessage = "initialize"
    export const EspFrontOff: IpcMaintMessage = "esp.front.off"
    export const EspRearOff: IpcMaintMessage = "esp.rear.off"
}