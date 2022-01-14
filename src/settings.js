export function validateInitParameters(node, options){
    if ( !(node instanceof HTMLCanvasElement) ) { // Check dom node
        throw new TypeError('Node is required and should be canvas element');
    }
    if (!options.images || !Array.isArray(options.images) || options.images.length <= 1 ) { // Check images list
        throw new TypeError('options.images is required and must be an array with more than 1 element');
    }
    if ( ("preload" in options) && // Check preload type
        (
            !(typeof options.preload  === "string")
            || !(options.preload === "all" || options.preload === "none" || options.preload === "partial")
        )
    ) {
        throw new TypeError('options.preload must be one of these: all, none, partial');
    }
    if ( ("preloadNumber" in options)
        && !( Number.isInteger(Number.parseInt(options.preloadNumber)) && Number.parseInt(options.preloadNumber) >= 0 )
    ) {
        throw new TypeError('options.preloadNumber must be number >= 0');
    }
    options.preloadNumber = Number.parseInt(options.preloadNumber); // Allow number as a string

    if ("fillMode" in options)  {
        let allowedModes = ['cover', 'contain'];
        if ( !allowedModes.includes(options.fillMode) ) {
            throw new TypeError('options.fillMode must be "cover" or "contain"');
        }
    }
}

export const defaultSettings = {
    preload: "all",
    preloadNumber: 0,
    poster: false,
    fps: 30,
    loop: false,
    reverse: false,
    inversion: false,
    autoplay: false,
    ratio: undefined,
    fillMode: "cover",

    draggable: false,
    touchScrollMode: "pageScrollTimer",
    pageScrollTimerDelay: 1500,

    onPreloadFinished: undefined,
    onPosterLoaded: undefined,
    onBeforeFrame: undefined,
    onAfterFrame: undefined
}
