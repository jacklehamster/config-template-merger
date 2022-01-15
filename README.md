# ![https://www.flaticon.com/free-icon/merge_690328](icon.png) config-template-merger
Utility for merging json configs through various JSONs together, and by replacing variables.

## Setup

### Directly in web page

Include the scripts in html as follow:
```
<script src="https://unpkg.com/dok-file-utils/src/config-template-merger.js"></script>
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

### FileUtils

#### Description
FileUtils is used to load files. It caches data for duplicate files loaded to avoid repeated loads.

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

### ImageLoader

#### Description
ImageLoader is used for loading images. Like FileUtils, it caches images to avoid duplicate. ImageLoader tracks progress of downloaded images, and it uses Blob to provide a URL that can be reused to avoid multiple load of images.

### Usage
```
const imageLoader = new ImageLoader({
			"assets/cursor.png": true,
		});
const image = await imageLoader.load("image.png");

const cursor = await imageLoader.load("assets/cursor.png");
// In this case, cursor.url is the URL of a block that can be reused. This is useful when using a changing cursor in CSS that points to an image, avoiding repeated load of that image.
```

### Demo

[demo](https://jacklehamster.github.io/dok-file-utils/)