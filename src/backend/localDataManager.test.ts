import assert from 'power-assert';
import * as mocha from 'mocha';
import SequenceData from './model/sequenceData';
import LocalDataManager from './localDataManager';
import SequenceDataset from './model/sequenceDataset';


describe("LocalDataManager", () => {
    const mng = new LocalDataManager();
    mng.basepath = __dirname || './';
    mng.sequenceDataFilename = 'test.sequence.json';
    console.log(mng.basepath);

    let json = { list: [
        [ "mononoke", "1.2", "front", "high", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "5", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "12", "front", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "12", "rear", "low", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "18", "front", "off", "予備のコラム", "メモ、コメント用" ],
        [ "mononoke", "25", "rear", "off", "予備のコラム", "メモ、コメント用" ],
        ] };

    it("save seququence", () => {
        let data = new SequenceDataset();
        for (let row of json.list) {
            data.list.push(SequenceData.fromAny(row));
        }
        mng.saveSequenceDataset(data);
    });

    it("load sequence", () =>  {
        let data = mng.loadSequenceDataset();
        assert.equal(data.list.length, json.list.length);
    });

});