'use strict';

import {PlayerCommand, ESPrCommand, TargetDevice} from './defines';
import {MqttManager,MqttManagerEventCallback} from './mqttManager';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import SequenceDataManager from './sequenceDataManager';
import SequenceData from './model/sequenceData';
import MqttData from './model/mqttData';
import {Config} from './config';


const mqtt = new MqttManager(Config.MQ_URL, Config.MQ_USER, Config.MQ_PASS);
let seqData: SequenceDataManager | null = null;

// ローカルに保存済みのシーケンスデータがある場合は読み込む
// TODO:
// seqData = loadFromLocal();
// seqData.on("data", (row) => onSequenceEvent(row) );

// MQTT brokerへ接続
mqtt.connect();
mqtt.onConnectEvent = () => {
    // client.subscribe('presence')
    process.send(new IpcMessage(IpcMessageType.State, "mqtt.connected")); //親に通知
    initialize(); //イニシャライズ
};

// parent processからのコマンド
process.on("message", async (msg) => {
    if (Config.DEBUG) console.log(msg);
    let msgObj = IpcMessage.fromAny(msg);
    if (Config.DEBUG) console.log(msgObj.type);
    switch(msgObj.type) {
        case IpcMessageType.State:
            if (Config.DEBUG) console.log(msgObj.payload);
            // FIXME
            break;
        case IpcMessageType.Maint: //メンテナンス系
            switch (msgObj.payload) {
                case IpcMaintMessage.Init:
                    initialize();
                    break;
                case IpcMaintMessage.EspFrontOff:
                    mqtt.sendCommandESPr(TargetDevice.Front, ESPrCommand.Off);
                    break;
                case IpcMaintMessage.EspRearOff:
                    mqtt.sendCommandESPr(TargetDevice.Rear, ESPrCommand.Off);
                    break;
            }
            break;
        case IpcMessageType.SequenceData: //シーケンスデータ
            // msgObj.payload = [ {topic, timeline, ...}, ... ]
            setSequenceData(msgObj.payload);
            break;
        case IpcMessageType.Command: //再生制御
            let res: boolean;
            switch (msgObj.payload) {
                case PlayerCommand.Play:
                    res = await doPlay();
                    break;
                case PlayerCommand.Pause:
                    res = await doPause();
                    break;
                case PlayerCommand.Reset:
                    res = await doReset();
                    break;
            }
            process.send(new IpcMessage(IpcMessageType.CommandResult, { kind: msgObj.payload, result: res })); //親に通知
            break;
        default:
            console.error('unsupported message from parent');
    }
});

process.on("exit", () =>  {
    console.info("child exit");
});

//起動を親に通知
process.send(new IpcMessage(IpcMessageType.State, "running")); //親に通知


// -------------------------

/**
 * 初期化
 */
function initialize() {
    // デバイスの初期化
    mqtt.sendCommandESPr(TargetDevice.Front, ESPrCommand.Low);
    mqtt.sendCommandESPr(TargetDevice.Rear, ESPrCommand.Low);
    mqtt.sendCommadPlayer(PlayerCommand.Reset);

    setTimeout(() => {
        mqtt.sendCommandESPr(TargetDevice.Front, ESPrCommand.Off);
        mqtt.sendCommandESPr(TargetDevice.Rear, ESPrCommand.Off);
    }, 2 * 1000);
}

/**
 * シーケンスファイルをセットする
 * @param value  [ {topic, timeline, ...}, ... ]
 */
function setSequenceData(list: Array<SequenceData>) {
    // seqData = SequenceDataManager.fromAny(value);
    seqData = new SequenceDataManager();
    seqData.setData(list);
    seqData.on("initData", () => {
        //データリセット
        process.send(new IpcMessage(IpcMessageType.State, "player.data.init")); //親に通知
    });
    seqData.on("data", (row) => { //SequenceDataManagerで送信要求が発生した時の処理
        // let obj: SequenceData = row;
        // let mqttData = obj.toMqttObject();
        // emmitでmethodsが死ぬ？データ落ちしてる
        let mqttData = new MqttData(row.deviceId, row.command, row.topic);
        mqtt.send(mqttData);
        process.send(new IpcMessage(IpcMessageType.State, "player.data.send")); //親に通知
    });
    seqData.on("dataEnd", () => {
        //再生終了
        process.send(new IpcMessage(IpcMessageType.State, "player.data.end")); //親に通知
    });
    seqData.on("stopData", () => {
        //手動停止系
        process.send(new IpcMessage(IpcMessageType.State, "player.data.stop")); //親に通知
    });
}

/**
 * 再生開始
 */
async function doPlay() {
    if (seqData.start()) {
        mqtt.sendCommadPlayer(PlayerCommand.Play);
        return true;
    } else {
        return false;
    }
}

/**
 * 一時停止
 */
async function doPause() {
    // ESPrの制御が途中であればステータスを保存 //動作させたままでもいいか？
    if (seqData.pause()) {
        mqtt.sendCommadPlayer(PlayerCommand.Pause);
        return true;
    } else {
        return false;
    }
}


/**
 * 最初から再生
 */
async function doReset() {
    if (seqData.reset()) {
        mqtt.sendCommadPlayer(PlayerCommand.Reset);
        return true;
    } else {
        return false;
    }
}


