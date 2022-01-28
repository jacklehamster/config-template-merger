const expect = require('chai').expect;

const { ConfigMerger } = require('./index.js');
const { FileUtils } = require("dok-file-utils");

const MockXMLHttpRequest = require('mock-xmlhttprequest');
const MockXhr = MockXMLHttpRequest.newMockXhr();

// Mock JSON response
MockXhr.onSend = (xhr) => {
  const responseHeaders = { 'Content-Type': 'application/json' };
  const response = '{ "field2": 345 }';
  xhr.respond(200, responseHeaders, response);
};

describe('ConfigMerger', function() {
  it('should merge configs', async function() {
  	const fileUtils = new FileUtils(MockXhr);
  	const configMerger = new ConfigMerger(fileUtils, {
  		constant: 567,
  	});

  	const source = {
  		"field1": 123,
  		template: "test-template.json",
  		"field3": "{constant * 10}",
  	};

  	const result = await configMerger.process(source, "path/", {
  		viewportSize: [100, 200],
  	});
  	expect(result.field1).to.equal(123);
  	expect(result.field2).to.equal(345);
  	expect(result.field3).to.equal(5670);
  	console.log("result", result);
  });

  it('should merge with repeat', async function() {
    const fileUtils = new FileUtils(MockXhr);
    const configMerger = new ConfigMerger(fileUtils, {
      constant: 567,
    });

    const source = {
      "multiField": {
        "repeat": 5,
        "value": "{index * 2}"
      },
    };

    const result = await configMerger.process(source, "path/", {
      viewportSize: [100, 200],
    });
    expect(result.multiField[0].value).to.equal(0);
    expect(result.multiField[1].value).to.equal(2);
    expect(result.multiField[2].value).to.equal(4);
    expect(result.multiField[3].value).to.equal(6);
    expect(result.multiField[4].value).to.equal(8);
    console.log("result", result);
  });

  it('should merge with table', async function() {
    const fileUtils = new FileUtils(MockXhr);
    const configMerger = new ConfigMerger(fileUtils, {
      constant: 567,
    });

    const source = {
      "multiTable": {
        "table": [5, 3, 2],
        "value": "{row} / {col} / {dim}"
      },
    };

    const result = await configMerger.process(source, "path/", {
    });
    expect(result.multiTable.length).to.equal(5*3*2);
    expect(result.multiTable[result.multiTable.length - 1].value).to.equal('2 / 4 / 1');
    console.log("result", result);
  });
});