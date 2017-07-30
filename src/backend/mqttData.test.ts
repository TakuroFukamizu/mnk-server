import assert from 'power-assert';
import 'mocha';
import MqttData from './mqttData';

describe("MqttData", () => {
    it("should have a name", () => {
        let data = MqttData.PlayerPlay();
        console.log(data.toJson());
        // assert.equal(testTarget.name, "test");
    });
});