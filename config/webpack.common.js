const path = require('path');
const { LIB_FILE_NAME, LIB_NAME } = require( './shared');

const config = {
    entry: path.join(__dirname, "../src/index.js"),
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: `${LIB_FILE_NAME}.umd.min.js`,
        library: {
            name: LIB_NAME,
            type: 'umd',
            export: 'default',
            //umdNamedDefine: true,
        },
        globalObject: 'this',
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
