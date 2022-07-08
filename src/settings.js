export function validateInitParameters(node, options){
    if ( !(node instanceof HTMLCanvasElement) ) { // Check dom node
        throw new TypeError('node is required and should be canvas element');
    }
    if (!options.images || !Array.isArray(options.images) || options.images.length <= 1 ) { // Check images list
        throw new TypeError('options.images is required and must be an array with more than 1 element');
    }
    // if ( ("preload" in options) && // Check preload type
    //     (
    //         !(typeof options.preload  === "string")
    //         || !(options.preload === "all" || options.preload === "none" || options.preload === "partial")
    //     )
    // ) {
    //     throw new TypeError('options.preload must be one of these: all, none, partial');
    // }
    // if ( ("preloadNumber" in options)
    //     && !( Number.isInteger(Number.parseInt(options.preloadNumber)) && Number.parseInt(options.preloadNumber) >= 0 )
    // ) {
    //     throw new TypeError('options.preloadNumber must be number >= 0');
    // }
    if ('preloadNumber' in options) options.preloadNumber = Number.parseInt(options.preloadNumber); // Allow number as a string
    if ("fillMode" in options && !['cover', 'contain'].includes(options.fillMode))  delete options['fillMode'];
    if ('dragModifier' in options) options.dragModifier = Math.abs(+options.dragModifier);
}

export const defaultSettings = {
    preload: "all",
    preloadNumber: 0,
    poster: false,
    fps: 30,
    loop: false,
    autoplay: false,
    reverse: false,
    ratio: undefined,
    fillMode: "cover",

    draggable: false,
    inversion: false,
    dragModifier: 1,
    touchScrollMode: "pageScrollTimer",
    pageScrollTimerDelay: 1500,
    responsiveAspect: "width",

    fastPreview: false,

    onFastPreloadFinished: noOp,
    onPreloadFinished: noOp,
    onPosterLoaded: noOp,
    onAnimationEnd: noOp,
    onBeforeFrame: noOp,
    onAfterFrame: noOp,
}

export const eventPrefix = "animate-images:";

function noOp(){}
