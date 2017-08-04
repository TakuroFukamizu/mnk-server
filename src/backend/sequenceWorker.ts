'use strict';

import {PlayerCommand, ESPrCommand, TargetDevice} from './defines';
import {MqttManager,MqttManagerEventCallback} from './mqttManager';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import SequenceDataManager from './sequenceDataManager';
import SequenceData from './model/sequenceData';
import MqttData from './model/mqttData';
import {Config} from './config';

console.log("child start");

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
process.on("message", (msg) => {
    console.log(msg);
    let msgObj = IpcMessage.fromAny(msg);
    console.log(msgObj.type);
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
    seqData.on("data", (row) => { //SequenceDataManagerで送信要求が発生した時の処理
        // let obj: SequenceData = row;
        // let mqttData = obj.toMqttObject();
        // emmitでmethodsが死ぬ？データ落ちしてる
        let mqttData = new MqttData(row.deviceId, row.command, row.topic);
        mqtt.send(mqttData);
    });
    seqData.on("dataEnd", () => {
        //再生終了
    });
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


