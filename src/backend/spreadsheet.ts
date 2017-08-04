
import * as GoogleSpreadsheet from 'google-spreadsheet';
const creds = require('./MononokeVr-66c3a8761d4f.json');

export default class Spreadsheet {
    docId: string;
    doc: any;
    sheet: any;

    constructor() {
        this.docId = "1PjZ4KgqHhjmDMSmyA3-fDo8b1h48SWVO27pljt4TtlY";
        this.doc = new GoogleSpreadsheet(this.docId);
    }
    async load(): Promise<Array<GoogleSpreadsheet.SpreadsheetRow>> {
        // var creds_json = {
        //     client_email: 'takuro.f.1987@google.com',
        //     private_key: 'your long private key stuff here'
        // }
        
        await this.setAuth(creds);
        let ret = await this.getInfoAndWorksheets();
        // console.log('Loaded doc: '+ret.info.title+' by '+ret.info.author.email);
        let rows = await this.getRows(this.sheet);
        return rows;
    }
    private async setAuth(creds) {
        return new Promise((resolve, reject) => {
            this.doc.useServiceAccountAuth(creds, () => {
                resolve();
            });
        });
    }
    private async getInfoAndWorksheets() {
        return new Promise((resolve, reject) => {
            this.doc.getInfo((err, info) => {
                console.log('Loaded doc: '+info.title+' by '+info.author.email);
                let sheet = info.worksheets[0];
                console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
                this.sheet = sheet;
                resolve({info, sheet});
            });
        });
    }
    private async getRows(sheet): Promise<Array<GoogleSpreadsheet.SpreadsheetRow>> {
        return new Promise((resovle, reject) => {
            sheet.getRows({
                offset: 1,
                limit: 20
            }, (err, rows) => {
                console.log('Read '+rows.length+' rows');
                resovle(rows as Array<GoogleSpreadsheet.SpreadsheetRow>);
            });
        }) as Promise<Array<GoogleSpreadsheet.SpreadsheetRow>>;
    }
}