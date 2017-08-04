import assert from 'power-assert';
import 'mocha';
import {IpcMessage, IpcMessageType} from './ipcMessage';

describe("IpcMessage", () => {
    it("messages from parent", () => {
        let play = new IpcMessage(IpcMessageType.Command, "play");
        assert.equal(play.type, IpcMessageType.Command);
        assert.equal(play.payload, "play");

        let pause = new IpcMessage(IpcMessageType.Command, "pause");
        assert.equal(pause.type, IpcMessageType.Command);
        assert.equal(pause.payload, "pause");

        let resume = new IpcMessage(IpcMessageType.Command, "resume");
        assert.equal(resume.type, IpcMessageType.Command);
        assert.equal(resume.payload, "resume");
    });
});