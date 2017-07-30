"use strict";

const express = require('express');
const app = express();
const http = require('http').createServer(app);
// const io = require('socket.io')(http);

const child_process = require("child_process");
const seqWorker = child_process('./src/backend/sequenceWorker');

const DEFAULT_PORT = 80;

if (process.env.STUB) {
    console.info('STUB mode');
}
// photKind.setStubMode();

// ----------------------------------------------
// Sequence Worker
// ----------------------------------------------

// sequence workerをchild process実行
seqWorker.on("message", function (msg) {
    console.log(msg);

    setTimeout(function () {
        seqWorker.send({ message: "from parent" });
    }, 1000);
});
seqWorker.send({ message: "from parent" });

// ----------------------------------------------


// ----------------------------------------------
// WebServer
// ----------------------------------------------

app.use(express.static(__dirname + '/public'));

app.get('/_api/loadSeq', function(req, res){
    // TODO: Google Spreadsheetからデータを取得
    // https://www.npmjs.com/package/google-spreadsheet
    // child.send({ message: <<sequence data>> });

    // let name = req.query.name;
    // userProf.profile(name).then((parsedData) => {
    //     res.json(parsedData);
    // }).catch((errorCode) => {
    //     res.status(errorCode).end();
    // });
    
});

// io.on('connection', (socket) => {
//     console.log('connected', socket.client.id);

//     // Player向けのコマンド
//     socket.on('player.play', (msg) => {
//         child.send({ message: "play" });
//     });
//     socket.on('player.pause', (msg) => {
//         child.send({ message: "pause" });
//     });
//     socket.on('player.resume', (msg) => {
//         child.send({ message: "resume" });
//     });
// });


// const server = app.listen(process.env.PORT || DEFAULT_PORT, () => {
//     console.log("Node.js is listening to PORT:" + server.address().port);
// });
http.listen(process.env.PORT || DEFAULT_PORT, () => {
    console.log("Node.js is listening to PORT:" + process.env.PORT || DEFAULT_PORT);
});