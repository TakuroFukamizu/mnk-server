
import * as GoogleSpreadsheet from 'google-spreadsheet';
import {Config} from './config';
const creds = require('./assets/MononokeVr-66c3a8761d4f.json');

export default class Spreadsheet {
    docId: string;
    doc: any;
    sheet: any;

    constructor(docId: string = null) {
        this.docId = docId || Config.DEFAULT_DOCID;
        this.doc = new GoogleSpreadsheet(this.docId);
    }
    async load(): Promise<Array<GoogleSpreadsheet.SpreadsheetRow>> {
        // var creds_json = {
        //     client_email: 'takuro.f.1987@google.com',
        //     private_key: 'your long private key stuff here'
        // }
        
        await this.setAuth(creds);
        let ret = await this.getInfoAndWorksheets();
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
                if (err) { 
                    reject(err);
                }
                try {
                    if (Config.DEBUG) console.log('Loaded doc: '+info.title+' by '+info.author.email);
                    let sheet = info.worksheets[0];
                    if (Config.DEBUG) console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
                    this.sheet = sheet;
                    resolve({info, sheet});
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    private async getRows(sheet): Promise<Array<GoogleSpreadsheet.SpreadsheetRow>> {
        return new Promise((resovle, reject) => {
            sheet.getRows({
                offset: 1,
                limit: 200
            }, (err, rows) => {
                if (err) { 
                    reject(err);
                }
                if (Config.DEBUG) console.log('Read '+rows.length+' rows');
                resovle(rows as Array<GoogleSpreadsheet.SpreadsheetRow>);
            });
        }) as Promise<Array<GoogleSpreadsheet.SpreadsheetRow>>;
    }
}