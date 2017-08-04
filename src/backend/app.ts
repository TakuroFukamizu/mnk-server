"use strict";

import * as express from "express";
import * as http from 'http';
import * as child from 'child_process';
import * as path from 'path';
import {IpcMessage, IpcMessageType, IpcMaintMessage} from './model/ipcMessage';

const app = express();
const httpServer = http.createServer(app);

const DEFAULT_PORT = 80;

const PATH_SEQWORKER = path.join(__dirname, 'sequenceWorker');
const PATH_WEBAPP = path.join(__dirname, 'public');

if (process.env.STUB) {
    console.info('STUB mode');
}
// photKind.setStubMode();

let onExitProcess = false;

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
// Setup
// ----------------------------------------------

// デバイスの初期化
seqWorker.send(new IpcMessage(IpcMessageType.Maint, IpcMaintMessage.Init));


// ----------------------------------------------


// ----------------------------------------------
// WebServer
// ----------------------------------------------

app.use(express.static(PATH_WEBAPP));
app.get('/_api/loadSeq', (req, res) => {
    // TODO: Google Spreadsheetからデータを取得
    // https://www.npmjs.com/package/google-spreadsheet
    // child.send({ message: <<sequence data>> });
    seqWorker.send(new IpcMessage(IpcMessageType.SequenceData, {
        list: [
            [ "mononoke", "1.2", "front", "low", "予備のコラム", "メモ、コメント用" ],
            [ "mononoke", "1.2", "front", "low", "予備のコラム", "メモ、コメント用" ]
        ]
    }));

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
