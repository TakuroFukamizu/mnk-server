
import SequenceData from './model/sequenceData';
import * as events from 'events';

const Debug = true;

export default class SequenceDataManager extends events.EventEmitter {
    list: Array<SequenceData>;
    timerIntMillisec: number = 100;
    inPlaying: boolean = false;
    elapsedTime: number = 0; //再生経過時間(ms)

    private _que: Array<number>;
    private _lastQue: number;
    private _playTimer: NodeJS.Timer;

    constructor() {
        super();
        this.list = [];
        this.emit('ready');
    }
    setData(list: Array<SequenceData>) {
        this.list = list;
        clearInterval(this._playTimer);
        this._buildNewQue();
        this.elapsedTime = 0;
        this.inPlaying = false;
    }

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

        let prevTime = new Date().getTime();

        let tick = () => {
            // let timeElap = (new Date().getTime() - timeStart) + this.timerIntMillisec;
            // this.elapsedTime += this.timerIntMillisec;
            let now = new Date().getTime();
            let diff = (now - prevTime);
            this.elapsedTime += diff;
            prevTime = now;
            if (Debug) console.log(this.elapsedTime);

            while (!cur.done && ((cur.value.timeline) < this.elapsedTime) ) { //同じタイミングで実行するものがあれば、全て実行
                // 送信処理
                this.emit('data', cur.value);
                if (Debug) console.log(cur.value.timeline, cur.value.deviceId, cur.value.command);
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
        // if (!this.inPlaying) return false; //面倒なので、停止済みの場合も同じ処理にする
        clearInterval(this._playTimer); 
        this.inPlaying = false;
        this._que = this._que.slice(this._lastQue, this._que.length); //次から最後まで
        return true;
    }
    reset() {
        // if (this.inPlaying) return false;
        clearInterval(this._playTimer);
        this._buildNewQue();
        this.elapsedTime = 0;
        this.inPlaying = false;
        return true;
    }

    private * _items() {
        for(let i = 0; i<this._que.length; i++) {
            this._lastQue = i;
            let index = this._que[i];
            yield this.list[index];
        }
    }

    private _reachToEnd() {
        this._que = []; //再生対象は0
        clearInterval(this._playTimer);

        setTimeout(() => {
            this.inPlaying = false;
            this.emit("dataEnd");
        }, 500); // 500msバッファを置いて終了イベントを走らせる
    }
    private _buildNewQue() {
        this._que = this.list.map((row, i) =>  i );
    }
}