import { terser } from "rollup-plugin-terser";
const banner = require("./banner");

const bannerWithComments = "/*!\n" + banner + "\n*/";
const { LIB_FILE_NAME } = require( './shared');

export default {
    input: `./src/${LIB_FILE_NAME}.js`,
    output: [
        {
            file: `./build/${LIB_FILE_NAME}.esm.js`,
            format: 'es',
            banner: bannerWithComments,
            sourcemap: true
        },
        {
            file: `./build/${LIB_FILE_NAME}.esm.min.js`,
            format: 'es',
            banner: bannerWithComments,
            sourcemap: true,
            plugins: [terser()]
        }
    ],
};
