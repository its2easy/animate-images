const LIB_FILE_NAME = 'animate-images';
const LIB_NAME = 'AnimateImages';
const TERSER_OPTIONS = {
    mangle: {
        properties: {
            regex: /^_/,
        }
    },
}
module.exports = {LIB_FILE_NAME, LIB_NAME, TERSER_OPTIONS};


