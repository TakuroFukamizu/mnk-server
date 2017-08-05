"use strict";

import * as express from "express";
import * as http from 'http';
import * as child from 'child_process';
import * as path from 'path';
import {PlayerCommand} from './defines';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import LocalDataManager from './localDataManager';
import SequenceDataset from './model/sequenceDataset';
import SequenceData from './model/sequenceData';
import Spreadsheet from './spreadsheet';
import ConfigDataset from './model/configDataset';
import {Config} from './config';

const PATH_SEQWORKER = path.join(__dirname, 'sequenceWorker');
const PATH_WEBAPP = path.join(__dirname, 'public');

// ----------------------------------------------
// Setup
// ----------------------------------------------

const app = express();
const httpServer = http.createServer(app);

const local = new LocalDataManager();

let currentSeqData: SequenceDataset;
let isSeqDataApplied = false; //シーケンスデータが一度でもセットされているか

let inProgressSeq = false; //シーケンスの実行中か
let sendedSeqCount = 0; //送信済みのシーケンスの数

let isMqttConnected = false; //MQTT接続 YES/NO
let isChildProcessRun = false; //Workerのプロセスが起動済みかどうか
let onExitProcess = false; //収量処理中

let sequenceDocId = Config.DEFAULT_DOCID;

function initialize() {
    if (process.env.STUB) {
        console.info('STUB mode');
    }

    // ローカルファイルの設定
    local.basepath = __dirname;
    local.sequenceDataFilename = 'sequcence.json';
    local.configFilename = 'current_configs.json';

    // // デバイスの初期化
    // seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.Init));
    // まだつながってない。

    // 設定読み出し
    try {
        let currentConfig = local.loadConfig();
        sequenceDocId = currentConfig.sequenceDocId;
    } catch (error) {
        // デフォルトをそのまま使う
    }

    // 保存されているシーケンスデータをセット
    let dataset;
    try {
        dataset = local.loadSequenceDataset();
    } catch (error) {
        console.error('load sequenceData is failed: ', error);
        dataset = new SequenceDataset(); //エラーの場合は保存なし
    }
    setSequqnce(dataset);
    currentSeqData = dataset;
}

function checkState(): boolean {
    return isMqttConnected && isChildProcessRun;
}

function setSequqnce(dataset:SequenceDataset) {
    if (!isChildProcessRun) return false;

    seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, dataset.list));
    isSeqDataApplied = true;
    inProgressSeq = false;
    sendedSeqCount = 0;
    return true;
}

// ----------------------------------------------

// ----------------------------------------------
// Sequence Worker
// ----------------------------------------------

const seqWorker: child.ChildProcess = child.fork(PATH_SEQWORKER) // sequence workerをchild process実行
    .on("message", (msg) => {
        console.log(msg);
        let msgObj = IpcMessage.fromAny(msg);
        switch(msgObj.type) {
            case IpcMessageType.State:
                switch(msgObj.payload) {
                    case "mqtt.connected":
                        console.log("mqtt is ready");
                        isMqttConnected = true;
                        break;
                    case "running":
                        console.log("child process is ready");
                        isChildProcessRun = true;
                        if (!isSeqDataApplied) {
                            setSequqnce(currentSeqData);
                        }
                        break;
                    case "player.data.send": //シーケンスの送信実行(entity単位)
                        inProgressSeq = true;
                        sendedSeqCount++;
                        break;
                    case "player.data.end": //シーケンスの最後
                        inProgressSeq = false;
                        break;
                }
                // FIXME
                break;
            case IpcMessageType.Info:
                console.log(msgObj.payload);
                break;
            case IpcMessageType.CommandResult:
                //{ kind, result }
                console.log(msgObj.type, msgObj.payload.kind, ': ', msgObj.payload.result); // 実際の処理はCommand発行側で必要に応じて行う
                break;
            default:
                console.error('unsupported message from child');
        }

        // setTimeout(() => {
        //     seqWorker.send({ message: "from parent" });
        // }, 1000);
    })
    .on('exit', () => {
        if (!onExitProcess) {
            console.error("child process is dead.");
            isChildProcessRun = false;
            // FIXME
        }
    });

// ----------------------------------------------

// ----------------------------------------------
// WebServer
// ----------------------------------------------

app.use(express.static(PATH_WEBAPP));
app.get('/_api/status', (req, res) => {
    res.json({ 
        isChildProcessRun, 
        isMqttConnected, 
        isSeqDataApplied, 
        inProgressSeq, 
        sendedSeqCount, 
        totalSeqCount:currentSeqData.list.length 
    });
});
app.get('/_api/device/front/off', (req, res) => {
    // front off
    seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.EspFrontOff));
    res.json({ command: "frontOff", status: "success", message: "" });
});
app.get('/_api/device/rear/off', (req, res) => {
    // rear off
    seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.EspRearOff));
    res.json({ command: "rearOff", status: "success", message: "" });
});
app.get('/_api/changeDocId', (req, res) => {
    let docId = req.query.docId;
    if (docId == null || docId.length == 0) {
        res.status(500).json({ command: "changeDocId", status: "error", message: "入力された値が不正です。" });
        return;
    }
    local.saveConfigSequenceDocId(docId);
    sequenceDocId = docId;
    res.json({ command: "changeDocId", status: "success", message: "" });
});
app.get('/_api/loadSeq', async (req, res) => {
    // Google Spreadsheetからデータを取得
    if (!checkState() || inProgressSeq) {
        res.status(409).json({ command: "loadSeq", status: "error", message: "処理中か、開始処理が不足しているため実行できません。" });
        return;
    }
    try {
        // https://www.npmjs.com/package/google-spreadsheet
        let gs = new Spreadsheet(sequenceDocId);
        let rows = await gs.load();

        let dataset = new SequenceDataset();
        for(let row of rows) { //Google Spreadsheetのデータを変換
            // dataset.list.push(SequenceData.fromAny(row));
            console.log(row.deviceId);
            dataset.list.push(new SequenceData(
                row.topic, 
                parseFloat(row.timeline) * 1000, 
                row.deviceid, //toLowarCaseされる
                row.command, 
                row.data, 
                row.comment))
        }
        setSequqnce(dataset); //workerにセット
        currentSeqData = dataset;
        // seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, dataset.list));

        // ローカルに保存
        local.saveSequenceDataset(dataset);

        res.json({ command: "loadSeq", status: "success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ command: "loadSeq", status: "error", message: error });
    }
});
app.get('/_api/play', (req, res) => {
    playerCommandApi(res, PlayerCommand.Play);
});
app.get('/_api/pause', (req, res) => {
    playerCommandApi(res, PlayerCommand.Pause);
});
app.get('/_api/reset', (req, res) => {
    sendedSeqCount = 0;
    playerCommandApi(res, PlayerCommand.Reset);
});

async function playerCommandApi (res: any, kind: PlayerCommand) {
    if (!checkState()) {
        res.status(409).json({ command: kind, status: "error", message: "処理中か、開始処理が不足しているため実行できません。" });
        return Promise.reject(new Error("status error"));
    }
    let callback: any;
    return new Promise((resolve, reject) => {
        callback = (msg) => {
            let msgObj = IpcMessage.fromAny(msg);
            if (msgObj.type == IpcMessageType.CommandResult && msgObj.payload.kind == kind) {
                if (msgObj.payload.result) {
                    resolve();
                } else {
                    switch(kind) {
                        case PlayerCommand.Play: reject(new Error('操作できません。再生済みか、他の処理が実行中です。')); break;
                        case PlayerCommand.Pause: reject(new Error('操作できません。再生中ではないか、他の処理が実行中です。')); break;
                        case PlayerCommand.Reset: reject(new Error('操作できません。他の処理が実行中です。')); break;
                    }
                }
            } else {
                console.log('not match', msgObj.type, msgObj.payload.kind);
            }
        };
        seqWorker.on("message", callback);
        seqWorker.send(new IpcMessage(IpcMessageType.Command, kind));
        setTimeout(() => {
            reject(new Error("処理が時間切れになりました。サーバ内部でエラーが発生している可能性があります。"));
        }, 30 * 1000);
    }).then(() => {
        seqWorker.removeListener("message", callback);
        res.json({ command: kind, status: "success" });
    }).catch((e) => {
        console.error('playerCommandApi', e);
        seqWorker.removeListener("message", callback);
        console.log(e.message , e.name , e.toString());
        let msg = e.message || e.name || e.toString();
        res.status(500).json({ command: kind, status: "error", message: msg });
    });
}


// ----------------------------------------------

// ----------------------------------------------
// Execute
// ----------------------------------------------

initialize();

// const server = app.listen(process.env.PORT || DEFAULT_PORT, () => {
//     console.log("Node.js is listening to PORT:" + server.address().port);
// });
httpServer.listen(process.env.PORT || Config.HTTP_PORT, () => {
    console.log("Node.js is listening to PORT:" + process.env.PORT || Config.HTTP_PORT);
});

process.on("exit", () => {
    onExitProcess = true;
    seqWorker.kill();
    console.log("exit main process");
});
