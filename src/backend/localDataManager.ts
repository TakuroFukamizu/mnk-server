
import SequenceDataset from './model/sequenceDataset';
import * as fs from 'fs';
import * as path from 'path';

export default class LocalDataManager {
    basepath: string;
    sequenceDataFilename: string;

    private readJson(filepath: string) {
        let obj = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        // TODO: await/asyncで書き換える
        return obj;
    }

    private saveJson(filepath: string, data: any) {
        if (data.toJson === undefined) {
            fs.writeFileSync(filepath, JSON.stringify(data), 'utf8');
        } else {
            fs.writeFileSync(filepath, data.toJson(), 'utf8');
        }
    }

    // ------

    loadSequenceDataset() : SequenceDataset {
        let filepath = path.join(this.basepath, this.sequenceDataFilename);
        let jsonObj = this.readJson(filepath) as SequenceDataset;
        return jsonObj;
    }
    saveSequenceDataset(value: SequenceDataset) {
        console.log(this.basepath, this.sequenceDataFilename);
        let filepath = path.join(this.basepath, this.sequenceDataFilename);
        this.saveJson(filepath, value);
    }
}
