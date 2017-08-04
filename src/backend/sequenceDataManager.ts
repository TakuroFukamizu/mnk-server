
import SequenceData from './model/sequenceData';
import * as events from 'events';

export default class SequenceDataManager extends events.EventEmitter {
    list: Array<SequenceData>;
    timerIntMillisec: number = 100;
    inPlaying: boolean = false;

    private _que: Array<number>;
    private _playTimer: NodeJS.Timer;

    constructor() {
        super();
        this.list = [];
        this.emit('ready');
    }
    setData(list: Array<SequenceData>) {
        this.list = list;
        this._clearExecutedFlag();
    }
    // static fromAny(list: any) {
    //     let instance = new SequenceDataManager();
    //     for(let row of list) {
    //         try {
    //             let d = SequenceData.fromAny(row);
    //             instance.list.push(d);
    //         } catch (error) {
    //             // skip
    //             console.error(error, row);
    //         }
    //     }
    //     return instance;
    // }

    start() : boolean {
        if (this.inPlaying) { //再生中
            console.log('start is requested. but execute is inprogress');
            return false;
        }

        if (this._que.length == 0) { //再生対象無し
            console.log('start is requested. but seq data is empty or already executed.');
            return false;
        }

        let iterator = this._items();
        let cur: IteratorResult<SequenceData>;

        let timeStart = new Date().getTime();

        let tick = () => {
            let timeElap = (new Date().getTime() - timeStart) + this.timerIntMillisec;

            while (!cur.done && ((cur.value.timeline) < timeElap) ) { //同じタイミングで実行するものがあれば、全て実行
                // 送信処理
                console.log('data', cur.value);
                console.log('data-deviceId', cur.value.deviceId);
                console.log('data-topic', cur.value.topic);
                this.emit('data', cur.value);
                cur.value.executed = true;
                cur = iterator.next(); //次をセット
                if (cur.done) { //最後
                    this._reachToEnd();
                    break;
                }
            }
            this.inPlaying = true;
        };

        // 開始
        this._playTimer = setInterval(tick, this.timerIntMillisec);
        cur = iterator.next();
        tick(); //最初の0ms
        return true;
    }
    pause() {
        if (!this.inPlaying) return;
        clearInterval(this._playTimer); 
        this.inPlaying = false;
    }
    reset() {
        if (!this.inPlaying) return;
        clearInterval(this._playTimer);
        this._clearExecutedFlag();
        this.inPlaying = false;
    }

    private * _items() {
        for(let i of this._que) {
            yield this.list[i];
        }
    }

    private _reachToEnd() {
        setTimeout(() => {
            clearInterval(this._playTimer);
            this.inPlaying = false;
            this.emit("dataEnd");
        }, 500); // 500msバッファを置いて終了イベントを走らせる
    }
    private _clearExecutedFlag() {
        // for (let row of this.list) {
        //     row.executed = false; //未再生にする
        // }
        // this.list.forEach((row, i, arr) => {
        //     arr[i].executed = false; //未再生にする
        // });
        this._que = this.list.map((row, i) =>  i );
    }
}