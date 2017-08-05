import assert from 'power-assert';
import * as mocha from 'mocha';
import SequenceData from './model/sequenceData';
import SequenceDataManager from './sequenceDataManager';
import { ESPrCommand } from './defines'


describe("SequenceDataManager", () => {
    let mng = new SequenceDataManager();

    let json = { list: [
        [ "mononoke", "1.2", "front", "high", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "3", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "5", "front", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "5", "rear", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "8", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "10", "rear", "off", "予備のコラム", "メモ、コメント用" ],
        ] };

    it("from json", () => {
        mng.setData(json.list.map((row) => SequenceData.fromAny(row)));
        assert.equal(mng.list.length, json.list.length);
    });

    it("exec sequence", function(done) {
        this.timeout(50 * 1000);
        new Promise((resolve, reject) => {
            let lastTime = parseFloat(json.list.slice(-1)[0][1]) * 1000;

            let startTime = new Date().getTime();
            mng.on("data", (row) => {
                let elapsed = new Date().getTime() - startTime;
                let obj: SequenceData = row;
                let mqttData = obj.toMqttObject();
                console.log(mqttData.topic, mqttData.toJson());
                assert( (elapsed - obj.timeline) <= 100 ); //差分が100ms以下
            });
            mng.on("dataEnd", () => {
                //再生終了
                let elapsed = new Date().getTime() - startTime;
                assert( (elapsed - lastTime) <= 600 ); //差分が100ms+500ms以下
                resolve();
            });

            assert(mng.start()); //再生できること
            setTimeout(() => {
                assert(!mng.start()); //再生中は再生できないこと
            }, 1000);

        }).then(() => {
            mng.removeAllListeners("data");
            mng.removeAllListeners("dataEnd");
            done();
        }).catch((e) => {
            throw e;
        });
    });

    it("re-exec", () => {
        assert.equal(mng.start(), false); //再生済みの場合はresetしないと再生できないこと
        mng.reset();
    });

    it('start, pause, re-start', function(done) {
        this.timeout(50 * 1000);
        let json2 = { list: [
            [ "mononoke", "2", "front", "high", "lap1-1", "メモ、コメント用" ],
            [ "mononoke", "2", "rear", "high", "lap1-2", "メモ、コメント用" ],
            [ "mononoke", "4", "front", "low", "lap2-1", "メモ、コメント用" ],
            [ "mononoke", "6", "rear", "low", "lap2-2", "メモ、コメント用" ],
            [ "mononoke", "8", "front", "off", "lap2-3", "メモ、コメント用" ],
            [ "mononoke", "10", "rear", "off", "lap3-1", "メモ、コメント用" ],
        ] };
        mng.setData(json2.list.map((row) => SequenceData.fromAny(row)));
        const lap1 = 3 * 1000;
        const lap1Count = 2;
        const lap2 = 6 * 1000;
        const lap2Count = 3;
        const lap3 = 2 * 1000;
        const lap3Count = 1;

        mng.on("dataEnd", () => {
            //再生終了
            // done(); //Error: done() called multiple times
        });
        (async () => {
            let count1 = 0;
            mng.on("data", (row) => {
                console.info('1st lap data');
                console.log(count1, count1, row);
                assert.equal(row.data, json2.list[count1][4]);
                console.info('---');
                count1++;
            });
            assert(mng.start()); //再度、再生できること

            await (async () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        console.info('5');
                        mng.pause(); //送信したら一時停止
                        resolve();
                    }, lap1);
                });
            })();
            assert.equal(count1, lap1Count); //2個送信していること

            mng.removeAllListeners("data");
            // -----
            
            let count2 = 0;
            mng.on("data", (row) => {
                console.info('2nd lap data');
                console.log(count1 + count2, count2, row);
                assert.equal(row.data, json2.list[count1 + count2][4]);
                console.info('---');
                count2++;
            });
            assert(mng.start()); //再度、再生できること

            await (async () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        mng.pause(); //送信したら一時停止
                        resolve();
                    }, lap2 + 500);
                });
            })();
            assert.equal(count2, lap2Count); //3個送信していること

            mng.removeAllListeners("data");
            // -----
            
            let count3 = 0;
            mng.on("data", (row) => {
                console.log(count1 + count2 + count3, count3, row);
                assert.equal(row.data, json2.list[count1 + count2 + count3][4]);
                count3++;
            });
            assert(mng.start()); //再度、再生できること

            await (async () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        mng.pause(); //送信したら一時停止
                        resolve();
                    }, lap3);
                });
            })();
            assert.equal(count3, lap3Count); //1個送信していること

            // -----
            mng.reset();
            assert(mng.start()); //再度、再生できること
            mng.pause();
            mng.reset();

            mng.removeAllListeners("data");
            // mng.removeAllListeners("dataEnd");

            done();
        })();
    });
});