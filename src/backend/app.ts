"use strict";

import * as express from "express";
import * as http from 'http';
import * as child from 'child_process';
import * as path from 'path';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import LocalDataManager from './localDataManager';
import SequenceDataset from './model/sequenceDataset';
import SequenceData from './model/sequenceData';
import Spreadsheet from './spreadsheet';
import {Config} from './config';

const PATH_SEQWORKER = path.join(__dirname, 'sequenceWorker');
const PATH_WEBAPP = path.join(__dirname, 'public');

// ----------------------------------------------
// Setup
// ----------------------------------------------

const app = express();
const httpServer = http.createServer(app);

const local = new LocalDataManager();

let isMqttConnected = false;
let onExitProcess = false;
let isChildProcessRun = false;

function initialize() {
    if (process.env.STUB) {
        console.info('STUB mode');
    }

    // ローカルファイルの設定
    local.basepath = __dirname;
    local.sequenceDataFilename = 'sequcence.json';

    // // デバイスの初期化
    // seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.Init));
    // まだつながってない。

    // 保存されているシーケンスデータをセット
    let dataset;
    try {
        dataset = local.loadSequenceDataset();
    } catch (error) {
        dataset = new SequenceDataset(); //エラーの場合は保存なし
    }
    seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, dataset.list));
}

function checkState(): boolean {
    return isMqttConnected && isChildProcessRun;
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
                console.log(msgObj.payload);
                switch(msgObj.payload) {
                    case "mqtt.connected":
                        console.log("mqtt is ready");
                        isMqttConnected = true;
                        break;
                    case "running":
                        console.log("child process is ready");
                        isChildProcessRun = true;
                }
                // FIXME
                break;
            case IpcMessageType.Info:
                console.log(msgObj.payload);
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
    res.json({ isChildProcessRun, isMqttConnected });
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
app.get('/_api/loadSeq', async (req, res) => {
    // Google Spreadsheetからデータを取得
    // let name = req.query.docId;

    if (!checkState()) {
        res.json({ command: "loadSeq", status: "error", message: "busy" });
    }
    try {
        // https://www.npmjs.com/package/google-spreadsheet
        let gs = new Spreadsheet();
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
        seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, dataset.list));

        // ローカルに保存
        local.saveSequenceDataset(dataset);

        res.json({ command: "loadSeq", status: "success" });
        
    } catch (error) {
        console.error(error);
        res.json({ command: "loadSeq", status: "error", message: error });
    }

    // let name = req.query.name;
    // userProf.profile(name).then((parsedData) => {
    //     res.json(parsedData);
    // }).catch((errorCode) => {
    //     res.status(errorCode).end();
    // });
});
app.get('/_api/play', (req, res) => {
    if (!checkState()) {
        res.json({ command: "loadSeq", status: "error", message: "busy" });
    }
    seqWorker.send(new IpcMessage(IpcMessageType.Command, "play"));
    res.json({ command: "play", status: "success" });
});
app.get('/_api/pause', (req, res) => {
    if (!checkState()) {
        res.json({ command: "loadSeq", status: "error", message: "busy" });
    }
    seqWorker.send(new IpcMessage(IpcMessageType.Command, "pause"));
    res.json({ command: "pause", status: "success" });
});
app.get('/_api/reset', (req, res) => {
    if (!checkState()) {
        res.json({ command: "loadSeq", status: "error", message: "busy" });
    }
    seqWorker.send(new IpcMessage(IpcMessageType.Command, "reset"));
    res.json({ command: "reset", status: "success" });
});


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
