const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require("webpack");
const banner = require("./banner");
const TerserPlugin = require("terser-webpack-plugin");
const { LIB_FILE_NAME } = require( './shared');

module.exports = [
    merge(common, { // Minified
        mode: 'production',
        devtool: 'source-map',
        optimization: {
            minimizer: [ // fix license.txt from bannerPlugin
                new TerserPlugin({
                    extractComments: false,
                }),
            ]
        },
        plugins: [
            new webpack.BannerPlugin(banner)
        ],
    }),
    merge(common, { // Not minified
        mode: 'production',
        devtool: 'source-map',
        plugins: [
            new webpack.BannerPlugin(banner)
        ],
        output: {
            filename: `${LIB_FILE_NAME}.js`,
        },
        optimization: {
            minimize: false
        }
    })
];
