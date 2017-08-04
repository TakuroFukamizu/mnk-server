'use strict';

import {PlayerCommand, ESPrCommand, TargetDevice} from './defines';
import {MqttManager,MqttManagerEventCallback} from './mqttManager';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import SequenceDataManager from './sequenceDataManager';
import SequenceData from './model/sequenceData';

const MQ_URL = 'mqtt://localhost';

console.log("child start");

const mqtt = new MqttManager(MQ_URL);
let seqData: SequenceDataManager | null = null;
initSeqData(seqData);

// ローカルに保存済みのシーケンスデータがある場合は読み込む
// TODO:
// seqData = loadFromLocal();
// seqData.on("data", (row) => onSequenceEvent(row) );

// MQTT brokerへ接続
mqtt.connect();
mqtt.onConnectEvent = () => {
    // client.subscribe('presence')
    process.send(new IpcMessage(IpcMessageType.State, "mqtt.connected")); //親に通知
};

// parent processからのコマンド
process.on("message", (msg) => {
    console.log(msg);
    let msgObj = IpcMessage.fromAny(msg);
    switch(msgObj.type) {
        case IpcMessageType.State:
            console.log(msgObj.payload);
            // FIXME
            break;
        case IpcMessageType.Maint: //メンテナンス系
            switch (msgObj.payload) {
                case IpcMaintMessage.Init:
                    initialize();
                    break;
            }
            break;
        case IpcMessageType.SequenceData: //シーケンスデータ
            // msgObj.payload = { list: [ {topic, timeline, ...}, ... ], lastModified: number }
            seqData = SequenceDataManager.fromAny(msgObj.payload);
            initSeqData(seqData);
            break;
        case IpcMessageType.Command: //再生制御
            switch (msgObj.payload) {
                case PlayerCommand.Play:
                    doPlay();
                    break;
                case PlayerCommand.Pause:
                    doPause();
                    break;
                case PlayerCommand.Reset:
                    doReset();
                    break;
            }
            break;
        default:
            console.error('unsupported message from parent');
    }
});

process.on("exit", () =>  {
    console.log("child exit");
});


// -------------------------

function initSeqData(mng: SequenceDataManager) {
    mng.on("data", (row) => { //SequenceDataManagerで送信要求が発生した時の処理
        let obj: SequenceData = row;
        let mqttData = obj.toMqttObject();
        mqtt.send(mqttData);
    });
    mng.on("dataEnd", () => {
        //再生終了
    });
    return mng;
}

// -------------------------

/**
 * 初期化
 */
function initialize() {
    // デバイスの初期化
    mqtt.sendCommandESPr(TargetDevice.Front, ESPrCommand.High);
    mqtt.sendCommandESPr(TargetDevice.Rear, ESPrCommand.High);
    mqtt.sendCommadPlayer(PlayerCommand.Reset);
}

/**
 * 再生開始
 */
function doPlay() {
    mqtt.sendCommadPlayer(PlayerCommand.Play);
    seqData.start();
}

/**
 * 一時停止
 */
function doPause() {
    // ESPrの制御が途中であればステータスを保存 //動作させたままでもいいか？
    mqtt.sendCommadPlayer(PlayerCommand.Pause);
    seqData.pause();
}


/**
 * 最初から再生
 */
function doReset() {
    mqtt.sendCommadPlayer(PlayerCommand.Reset);
    seqData.reset();
}


