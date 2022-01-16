# ![https://www.flaticon.com/free-icon/merge_690328](icon.png) config-template-merger
Utility for merging json configs through various JSONs together, and by replacing variables.

[![CodeQL](https://github.com/jacklehamster/config-template-merger/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/jacklehamster/config-template-merger/actions/workflows/codeql-analysis.yml)

[![pages-build-deployment](https://github.com/jacklehamster/config-template-merger/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jacklehamster/config-template-merger/actions/workflows/pages/pages-build-deployment)

## Setup

### Directly in web page

Include the scripts in html as follow:
```
<script src="https://unpkg.com/config-template-merger/public/config-merger.js"></script>
```


### Through NPM


Add to `package.json`:
```
  "dependencies": {
  	...
    "config-template-merger": "^1.0.0",
    ...
  }
```


Use Browserify to make classes available in browser

In `package.json`:
```
  "scripts": {
  	...
    "browserify": "browserify browserify/main.js -s dok-lib -o public/gen/compact.js",
    ...
  },

```

In `browserify/main.js`:
```
const { ConfigMerger } = require('config-template-merger');

module.exports = {
  ConfigMerger,
};
```

## Components

### ConfigMerger

#### Description
ConfigMerger is used to compose templates using various

#### Usage
path/test-template.json
```
{ "field2" : 345 }
```

```
  	const configMerger = new ConfigMerger(fileUtils, true, {
  		constant: 567,
  	});

  	const source = {
  		"field1": 123,
  		template: "test-template.json",
  		"field3": "{constant * 10}",
  		"multiField": {
  			"repeat": 5,
  			"value": "{index * 2}"
  		},
  	};

  	const result = await configMerger.process(source, "path/", {
  		viewportSize: [100, 200],
  	});


  	/* RESULT
{
  field2: 345,
  field1: 123,
  field3: 5670,
  multiField: [
    { value: 0 },
    { value: 2 },
    { value: 4 },
    { value: 6 },
    { value: 8 }
  ]
}
  	*/
 
```

### Demo

[demo](https://jacklehamster.github.io/config-template-merger/)