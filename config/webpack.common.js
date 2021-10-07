const path = require('path');
const { LIB_FILE_NAME, LIB_NAME } = require( './shared');

const config = {
    entry: path.join(__dirname, "../src/animate-images.js"),
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: `${LIB_FILE_NAME}.min.js`,
        library: {
            name: LIB_NAME,
            type: 'var',
            export: 'init',
        }
        // library: LIB_NAME,
        // globalObject: 'this',
        // //libraryExport: 'default',
        // libraryTarget: 'umd',
        // umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    },
    plugins: [ ],
};
module.exports = config;
