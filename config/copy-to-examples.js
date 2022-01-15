const fs = require('fs');
const path = require('path');
const { LIB_FILE_NAME } = require( './shared');

let source = path.join(__dirname, `../build/${LIB_FILE_NAME}.umd.min.js`);
let dest = path.join(__dirname, `../example/${LIB_FILE_NAME}.umd.min.js`);

fs.copyFile(source, dest, function (err) {
    if (err) return console.error(err);
    console.log('Copied to ' + dest);
});
