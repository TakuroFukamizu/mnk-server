import assert from 'power-assert';
import * as mocha from 'mocha';
import Spreadsheet from './spreadsheet';
import {Config} from './config';


describe("Spreadsheet", () => {
    const gs = new Spreadsheet(Config.DEFAULT_DOCID);
    it("load data from google", function(done) {
        this.timeout(30 * 1000);
        
        gs.load().then((rows) => {
            assert(rows.length > 0);
            done();
        });
    });

});