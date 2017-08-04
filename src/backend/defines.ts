

export type PlayerCommand = "play" | "pause" | "reset";
export namespace PlayerCommand{
    export const Play: PlayerCommand = "play"
    export const Pause: PlayerCommand = "pause"
    export const Reset: PlayerCommand = "reset"
}

export type ESPrCommand = "high" | "low" | "off";
export namespace ESPrCommand{
    export const High: ESPrCommand = "high"
    export const Low: ESPrCommand = "low"
    export const Off: ESPrCommand = "off"
}

export type TargetDevice = "player" | "front" | "rear";
export namespace TargetDevice{
    export const Player: TargetDevice = "player"
    export const Front: TargetDevice = "front"
    export const Rear: TargetDevice = "rear"
}
