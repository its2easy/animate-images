var fs = require('fs');
var path = require('path');

var source = path.join(__dirname, "../build/animate-images.min.js");
var dest = path.join(__dirname, "../example/animate-images.min.js");

fs.copyFile(source, dest, function (err) {
    if (err) return console.error(err);
    console.log('Copied to ' + dest);
});
