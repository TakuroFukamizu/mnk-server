import assert from 'power-assert';
import 'mocha';
import SequenceData from './sequenceData';
import { ESPrCommand } from './defines'


describe("SequenceData", () => {
    it("from json", () => {
        let jsonRow = [ "mononoke", "1.2", "front", "low", "予備のコラム", "メモ、コメント用" ];
        let data = SequenceData.fromAny(jsonRow);
        assert.equal(data.timeline, 1200);

        let mq = data.toMqttObject();
        assert.equal(mq.deviceId, "front");
        assert.equal(mq.command, ESPrCommand.Low);
        console.log(mq.toJson());
    });
});