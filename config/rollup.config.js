import { defineConfig } from 'rollup';
import { terser } from "rollup-plugin-terser";
import { babel } from '@rollup/plugin-babel';
import bundleSize from 'rollup-plugin-bundle-size';

const banner = require("./banner");
const bannerWithComments = "/*!\n" + banner + "\n*/";
const { LIB_FILE_NAME } = require( './shared');

export default defineConfig([
    { // Transpiled bundle
        input: `./src/index.js`,
        plugins: [
            babel({
                babelHelpers: 'bundled',
                exclude: "node_modules/**"
            }),
            bundleSize()
        ],
        output: [
            {
                file: `./build/${LIB_FILE_NAME}.esm.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
            },
            {
                file: `./build/${LIB_FILE_NAME}.esm.min.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
                plugins: [ terser() ]
            }
        ],
    },
    { // Untranspiled bundle
        input: `./src/index.js`,
        plugins: [
            bundleSize()
        ],
        output: [
            {
                file: `./build/untranspiled/${LIB_FILE_NAME}.esm.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
            },
            {
                file: `./build/untranspiled/${LIB_FILE_NAME}.esm.min.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
                plugins: [ terser() ]
            }
        ],
    },
]);
