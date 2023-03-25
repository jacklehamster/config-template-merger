const express 	= require('express');
const serve   	= require('express-static');
const fs 		= require('fs');
const icongen = require('icon-gen');
const UglifyJS = require("uglify-js");

const PORT = 3000;

const app = express();
const uglify = true;

app.get('/', (req, res, next) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	fs.promises.readFile(`${__dirname}/index.html`).then(html => {
		res.write(html);
		res.end();
	});
});
app.use(serve(`${__dirname}`));



  if (uglify) {
    console.log("uglifying");
	  const publicFolder = "public";
	  const path = "config-merger.js";
    const code = fs.readFileSync(`${publicFolder}/${path}`, "utf8");
    const filename = "out.js";
    const url = "out.js.map";
    const options = {
      sourceMap: {
        filename,
        url,
      },
    };
    const result = UglifyJS.minify(code, options);
    fs.writeFileSync(`${publicFolder}/${filename}`, result.code);
    fs.writeFileSync(`${publicFolder}/${url}`, result.map);
  }

const iconTimestampFile = "./icon-timestamp.txt";
const iconTimestamp = fs.existsSync(iconTimestampFile) ? fs.readFileSync(iconTimestampFile).toString() : 0;

const { mtime: iconModified } = fs.statSync('./icon.png');
if (`${iconModified.getTime()}` !== iconTimestamp) {
  icongen('icon.png', './public')
    .then((results) => {
      console.log(`${results.length} icons generated.`);
    })
    .catch((err) => {
      console.error(err)
    });
  fs.writeFileSync(iconTimestampFile, `${iconModified.getTime()}`);
}



const server = app.listen(PORT, () => {
	console.log('Demo running at %s', PORT);
});
