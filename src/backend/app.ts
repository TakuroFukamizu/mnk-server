"use strict";

import * as express from "express";
import * as http from 'http';
import * as child from 'child_process';
import * as path from 'path';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';
import LocalDataManager from './localDataManager';
import SequenceDataset from './model/sequenceDataset';
import SequenceData from './model/sequenceData';

const DEFAULT_PORT = 80;

const PATH_SEQWORKER = path.join(__dirname, 'sequenceWorker');
const PATH_WEBAPP = path.join(__dirname, 'public');

// ----------------------------------------------
// Setup
// ----------------------------------------------

const app = express();
const httpServer = http.createServer(app);

const local = new LocalDataManager();

let onExitProcess = false;

function initialize() {
    if (process.env.STUB) {
        console.info('STUB mode');
    }

    // ローカルファイルの設定
    local.basepath = path.join(__dirname, '.work');
    local.sequenceDataFilename = 'sequcence.json';

    // デバイスの初期化
    seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.Init));

    // 保存されているシーケンスデータをセット
    let dataset = local.loadSequenceDataset();
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
                // FIXME
                if (msgObj.payload == "mqtt.connected") {
                    console.log("mqtt is ready");
                }
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
            // FIXME
        }
    });

// ----------------------------------------------

// ----------------------------------------------
// WebServer
// ----------------------------------------------

app.use(express.static(PATH_WEBAPP));
app.get('/_api/loadSeq', (req, res) => {
    // TODO: Google Spreadsheetからデータを取得
    // https://www.npmjs.com/package/google-spreadsheet

    let jsonObj = {
        list: [
            [ "mononoke", "1.2", "front", "low", "予備のコラム", "メモ、コメント用" ],
            [ "mononoke", "1.2", "front", "low", "予備のコラム", "メモ、コメント用" ]
        ]
    };
    let dataset = new SequenceDataset();
    for(let row of jsonObj.list) {
        dataset.list.push(SequenceData.fromAny(row));
    }
    seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, dataset.list));

    // ローカルに保存
    local.saveSequenceDataset(dataset);

    res.json({ command: "loadSeq", status: "success" });

    // let name = req.query.name;
    // userProf.profile(name).then((parsedData) => {
    //     res.json(parsedData);
    // }).catch((errorCode) => {
    //     res.status(errorCode).end();
    // });
});
app.get('/_api/play', (req, res) => {
    seqWorker.send(new IpcMessage(IpcMessageType.Command, "play"));
    res.json({ command: "play", status: "success" });
});
app.get('/_api/pause', (req, res) => {
    seqWorker.send(new IpcMessage(IpcMessageType.Command, "pause"));
    res.json({ command: "pause", status: "success" });
});
app.get('/_api/reset', (req, res) => {
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
httpServer.listen(process.env.PORT || DEFAULT_PORT, () => {
    console.log("Node.js is listening to PORT:" + process.env.PORT || DEFAULT_PORT);
});

process.on("exit", () => {
    onExitProcess = true;
    seqWorker.kill();
    console.log("exit main process");
});
