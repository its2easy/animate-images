export function validateInitParameters(node, options){
    if ( !(node instanceof HTMLCanvasElement) ) { // Check dom node
        throw new TypeError('Node is required and should be canvas element');
    }
    if (!options.images || !Array.isArray(options.images) || options.images.length <= 1 ) { // Check images list
        throw new TypeError('options.images is required and must be an array with more than 1 element');
    }
    //console.log(Number.isInteger(Number.parseInt(options.preload)));
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

export function getDefaultSettings(){
    return {
        poster: false,
        draggable: false,
        preventTouchScroll: true,
        loop: false,
        reverse: false,
        autoplay: false,
        preload: "all",
        preloadNumber: 0,
        fps: 30,
        fillMode: "cover",
    }
}
