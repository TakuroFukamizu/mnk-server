export default class ConfigDataset {
    sequenceDocId: string;
    lastModified: number;

    constructor(sequenceDocId: string = null) {
        this.sequenceDocId = sequenceDocId;
        // this.lastModified;
    }

    toJson() {
        return JSON.stringify({ 
            sequenceDocId: this.sequenceDocId, 
            lastModified: this.lastModified
        });
    }
}