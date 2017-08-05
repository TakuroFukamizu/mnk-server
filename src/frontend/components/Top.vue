<template lang="pug">
    section.section
        template(v-if="isShowMessage")
            .notification.is-success
                button.delete(v-on:click="disableMessage")
                p {{message}}
        // .columns
        //     .column.is-10.is-offset-1
        //         div(style="margin-left:auto; margin-right:auto;") {{message}}
        template(v-if="hasError")
            .notification.is-danger
                button.delete(v-on:click="disableMessage")
                p {{message}}
        template(v-if="isLoading")
            .columns.is-full
                .column.is-10.is-offset-1
                    p {{progressMessage}}
                    div.sk-folding-cube
                        .sk-cube1.sk-cube
                        .sk-cube2.sk-cube
                        .sk-cube4.sk-cube
                        .sk-cube3.sk-cube
                // mdl-progress(indeterminate)
        template(v-else)
            .columns.is-mobile.is-multiline
                .column.is-half-desktop.is-left.is-full-mobile
                    span.icon.is-small.is-left
                    i.fa.fa-play-circle-o(v-if="svInProgressSeq")
                    i.fa.fa-stop-circle-o(v-else)
                    span {{svSendedSeqCount}}/{{svTotalSeqCount}} SEQ
                .column.is-right
                    p 開始から {{ parseMsToString(elapsedTime) }}
            .columns.is-mobile.is-multiline
                .column.is-one-third-desktop.is-full-mobile
                    section.panel
                        p.panel-heading 再生関連
                        .panel-block
                            button.button.is-primary(v-on:click="play")
                                i.fa.fa-play
                                span.icon.is-small.is-left
                                span PLAY
                        .panel-block
                            button.button.is-primary(v-on:click="pause")
                                i.fa.fa-pause
                                span.icon.is-small.is-left
                                span PAUSE
                        .panel-block
                            button.button.is-primary(v-on:click="reset")
                                i.fa.fa-undo
                                span.icon.is-small.is-left
                                span RESET
                .column.is-one-third-desktop.is-full-mobile
                    section.panel
                        p.panel-heading 保守
                        .panel-block
                            button.button.is-primary(v-on:click="loadSeq")
                                i.fa.fa-cog
                                span.icon.is-small.is-left
                                span LOAD SEQUENCE
                        .panel-block
                            button.button.is-primary(v-on:click="frontOff")
                                i.fa.fa-cog
                                span.icon.is-small.is-left
                                span FRONT ON/OFF
                        .panel-block
                            button.button.is-primary(v-on:click="rearOff")
                                i.fa.fa-cog
                                span.icon.is-small.is-left
                                span REAR ON/OFF
                .column.is-one-third-desktop.is-full-mobile
                    section.panel
                        p.panel-heading Spreadsheet ID変更
                        .panel-block
                            p シーケンス(Google Spreadsheet)のID変更
                        .panel-block
                            .content.columns.field.has-addons
                                p.control.is-expanded
                                    input.input(v-model="docId" type="text" placeholder="spreadsheet id")
                                p.control
                                    button.button.is-primary(v-on:click="changeDocId") 変更
                        .panel-block
                            p 変更は取り消すことができません。また、再度読み込み(LOAD SEQUENCE)が必要になります。注意してください。
</template>

<script>
import playerCommand from 'mixins/playerCommand';
import maintCommand from 'mixins/maintCommand';
let timer = null;
export default {
    name: 'Player',
    mixins: [playerCommand, maintCommand],
    data () {
        return {
            isLoading: false,
            isShowMessage: false,
            progressMessage: "処理中...",
            message: null,
            hasError: false,
            docId: null,
            isShowDocIdModal: false,
            elapsedTime: 0,
            svInProgressSeq: false,
            svSendedSeqCount: 0,
            svTotalSeqCount: 0
        }
    },
    methods: {
        disableMessage: function() {
            this.isShowMessage = false;
            this.hasError = false;
        },
        checkStatus: function() {
            this.maintCommandCheckStatus().then((status) => {
                //{ isChildProcessRun, isMqttConnected, isSeqDataApplied, inProgressSeq, sendedSeqCount, totalSeqCount }
                this.svInProgressSeq = status.inProgressSeq;
                this.svSendedSeqCount = status.sendedSeqCount;
                this.svTotalSeqCount = status.totalSeqCount;
            }).catch((e) => {
                console.error(d);
            });
        },
        frontOff: function() {
            this._loadStartWithMessage("Frontに送信...");
            this.maintCommandFrontOff().then(() => {
                this._loadEndWithMessage("ON/OFFコマンドを送信しました");
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        rearOff: function() {
            this._loadStartWithMessage("Rearに送信...");
            this.maintCommandRearOff().then(() => {
                this._loadEndWithMessage("ON/OFFコマンドを送信しました");
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        changeDocId: function() {
            this._clearTimer();
            if (this.docId == null) return;
            this._loadStartWithMessage("Google Spreadsheetの変更...");
            this.maintCommandChangeDocId(this.docId).then(() => {
                this._loadEndWithMessage("シーケンスに使用するGoogle Spreadsheetのファイルを変更しました。LOAD SEQUENCE で再読み込みしてください。");
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        loadSeq: function() {
            this._clearTimer();
            this._loadStartWithMessage("Google Spreadsheetから読み込み...");
            this.maintCommandLoadSeq().then(() => {
                this._loadEndWithMessage("Google Spreadsheetからシーケンスを読み込みました");
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        play: function() {
            this._loadStartWithMessage("再生開始中...");
            this.playerCommandPlay().then(() => {
                this._loadEndWithMessage("再生を開始しました。");
                this.elapsedTime = 0;
                this._startTimer();
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        pause: function() {
            this._loadStartWithMessage("一時停止中...");
            this.playerCommandPause().then(() => {
                this._loadEndWithMessage("一時停止しました。PLAYで再開するか、RESETで先頭に戻してください。");
                this._stopTimer();

                this.checkStatus(); //ステータス更新
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        reset: function() {
            this._loadStartWithMessage("リセット中...");
            this.playerCommandReset().then(() => {
                this._loadEndWithMessage("リセットしました");
                this._clearTimer();
                
                this.checkStatus(); //ステータス更新
            }).catch((e) => {
                this._loadEndWithError(e);
            });
        },
        parseMsToString: (value) => {
            const pad = (v) => ("00"+v).slice(-2);
            value = Math.round(value / 1000);
            let h = value / 3600 | 0;
            let m = value % 3600 / 60 | 0;
            let s = value % 60;
            if (h != 0) {
                return h+":"+pad(m)+":"+pad(s);
            } else if (m != 0) {
                return m+":"+pad(s);
            } else {
                return s;
            }
        },
        _loadStartWithMessage(msg) {
            this.isLoading = true;
            this.isShowMessage = false;
            this.hasError = false;
            this.progressMessage = msg;
        },
        _loadEndWithMessage(msg) {
            this.isLoading = false;
            this.isShowMessage = true;
            this.hasError = false;
            this.message = msg;
        },
        _loadEndWithError(e) {
            this.isLoading = false;
            this.isShowMessage = false;
            this.hasError = true;
            this.message = e;
        },
        _startTimer() {
            let prevTime = new Date().getTime();
            let tick = () => {
                let now = new Date().getTime();
                let diff = (now - prevTime);
                this.elapsedTime += diff;
                prevTime = now;

                if ( (this.elapsedTime % 5000) != 0 ) { //5秒ごとにステータス更新
                    this.checkStatus();
                }
            };
            this.timer = setInterval(tick, 1000);
            tick(); //最初の0秒
            this.checkStatus();
        },
        _stopTimer() {
            clearInterval(this.timer); 
        },
        _clearTimer() {
            clearInterval(this.timer); 
            this.elapsedTime = 0;
        }
    }
}
</script>
