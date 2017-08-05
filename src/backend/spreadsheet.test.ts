import assert from 'power-assert';
import * as mocha from 'mocha';
import Spreadsheet from './spreadsheet';


describe("Spreadsheet", () => {
    const gs = new Spreadsheet();
    it("save seququence", (done) => {
        gs.load().then((rows) => {
            assert(rows.length > 0);
            done();
        });
    });

});