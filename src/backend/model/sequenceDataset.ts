import SequenceData from './sequenceData';

export default class SequenceDataset {
    list: Array<SequenceData>;
    version: number;

    constructor(list: Array<SequenceData> = []) {
        this.list = [];
    }

    toJson() {
        return JSON.stringify({ 
            list: this.list, 
            version: this.version 
        });
    }
}