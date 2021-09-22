export function validateInitParameters(node, options){
    if ( !(node instanceof HTMLCanvasElement) ) { // Check dom node
        throw new TypeError('Node is required and should be canvas element');
    }
    if (!options.images || !Array.isArray(options.images) || options.images.length <= 1 ) { // Check images list
        throw new TypeError('option.images is required and must be an array with more than 1 element');
    }
    //console.log(Number.isInteger(Number.parseInt(options.preload)));
    if ( ("preload" in options) && // Check preload type
        (
            !(typeof options.preload  === "string")
            || !(options.preload === "all" || options.preload === "none" || options.preload === "partial")
        )
    ) {
        throw new TypeError('option.preload must be one of these: all, none, partial');
    }
    if ( ("preloadNumber" in options)
        && !( Number.isInteger(Number.parseInt(options.preloadNumber)) && Number.parseInt(options.preloadNumber) >= 0 )
    ) {
        throw new TypeError('option.preloadNumber must be number >= 0');
    }
    options.preloadNumber = Number.parseInt(options.preloadNumber); // Allow number as a string
}

export function getDefaultSettings(){
    return {
        poster: false,
        draggable: false,
        loop: false,
        reverse: false,
        autoplay: false,
        preload: "all",
        preloadNumber: 0,
        fps: 30
    }
}

export function normalizeFrameNumber(frameNumber, totalImages){
    if (frameNumber <= 0) {
        return 1;
    } else if (frameNumber > totalImages) {
        return totalImages;
    }
    return frameNumber;
}

export function isOutOfRange(frameNumber, totalImages){
    return ( frameNumber <= 0 || frameNumber > totalImages );
}

export function pixelRatio(context) {
    const devicePixelRatio = window.devicePixelRatio || 1
    const backingStoreRatio =
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1
    return devicePixelRatio / backingStoreRatio
}
