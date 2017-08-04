import assert from 'power-assert';
import * as mocha from 'mocha';
import SequenceData from './model/sequenceData';
import SequenceDataManager from './sequenceDataManager';
import { ESPrCommand } from './defines'


describe("SequenceDataManager", () => {
    let mng: SequenceDataManager;

    let json = { list: [
        [ "mononoke", "1.2", "front", "high", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "5", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "12", "front", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "12", "rear", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "18", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "25", "rear", "off", "予備のコラム", "メモ、コメント用" ],
        ] };

    it("from json", () => {
        mng = SequenceDataManager.fromAny(json);
        assert.equal(mng.list.length, json.list.length);
    });

    it("exec sequence", function(done) {
        this.timeout(50 * 1000);
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
            done();
        });
        assert(mng.start()); //再生できること
        setTimeout(() => {
            assert(!mng.start()); //再生中は再生できないこと
        }, 1000);
        // assert.equal(data.timeline, 1.2);
    });

    it("re-exec", () => {
        assert(!mng.start()); //再生済みの場合はresetしないと再生できないこと
    });
});