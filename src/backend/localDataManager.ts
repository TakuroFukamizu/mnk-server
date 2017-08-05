
import SequenceDataset from './model/sequenceDataset';
import ConfigDataset from './model/configDataset';
import * as fs from 'fs';
import * as path from 'path';
import {Config} from './config';

export default class LocalDataManager {
    basepath: string;
    sequenceDataFilename: string;
    configFilename: string;

    private _config: ConfigDataset;

    private readJson(filepath: string) {
        if (Config.DEBUG) console.log('load: ', filepath);
        let obj = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        // TODO: await/asyncで書き換える
        return obj;
    }

    private saveJson(filepath: string, data: any) {
        if (Config.DEBUG) console.log('save: ', filepath);
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
        let filepath = path.join(this.basepath, this.sequenceDataFilename);
        this.saveJson(filepath, value);
    }

    loadConfig(): ConfigDataset {
        let filepath = path.join(this.basepath, this.configFilename);
        let jsonObj = this.readJson(filepath) as ConfigDataset;
        this._config = jsonObj;
        return jsonObj;
    }
    saveConfigSequenceDocId(value: string) {
        let filepath = path.join(this.basepath, this.configFilename);
        if (this._config == null) this._config = new ConfigDataset();
        this._config.sequenceDocId = value;
        this._config.lastModified = new Date().getTime(); //最終更新日を更新
        this.saveJson(filepath, this._config);
    }
}
