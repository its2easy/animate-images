import { validateInitParameters, getDefaultSettings } from "./utils";
import { startLoadingImages } from "./preload";

/**
 * @param {Element|HTMLCanvasElement} node - Canvas DOM Node
 * @param {Object} options - Options
 * @param {Array} options.images - Array with images URLs (required)
 * @param {String} [options.preload="all"] - Preload mode ("all", "none", "partial")
 * @param {Number} [options.preloadNumber=0] - Number of preloaded images for option.preload="partial", 0 for all
 * @param {Number} [options.fps=30] - FPS when playing
 * @param {String} options.poster - Url of a poster image, to show before load
 * @param {Boolean} [options.draggable = false] - Draggable by mouse or touch
 * @param {Boolean} [options.loop=false] - Whether to start a new cycle at the end
 * @param {Boolean} [options.reverse=false] - Reverse direction
 * @param {Boolean} [options.autoplay=false] - Autoplay
 * @param {Function} options.onPreloadFinished - Occurs when all image files have been loaded
 */
export function init(node, options = {}) {
    validateInitParameters(node, options);
    let settings = {...getDefaultSettings(), ...options};

    let data = {
        currentFrame: 1,
        isAnimating: false,
        totalImages: options.images.length,
        loadedImagesArray: [], // images objects [0 - (images.length-1)]
        deferredAction: null, // call after full preload
        load: {
            isPreloadFinished: false, // onload on all the images
            preloadOffset: 0, // images already in queue
            preloadedImagesNumber: 0, // count of loaded images
            isLoadWithErrors: false,
            onLoadFinishedCB: afterPreloadFinishes,
        }
    }


    function initPlugin(){
        console.log('init');
        if (settings.preload === 'all' || settings.preload === "partial"){
            let preloadNumber = (settings.preload === 'all') ? data.totalImages : settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = data.totalImages;
            startLoadingImages(preloadNumber, { node, settings, data });
        }
    }

    function afterPreloadFinishes(){ // check what to do next
        console.log('preload finished');
        if ("onPreloadFinished" in settings) settings.onPreloadFinished();
        node.dispatchEvent( new Event('animate-images:preload-finished') );
        if (data.deferredAction) data.deferredAction();
    }

    // Pubic API
    let plugin = {
        play(){
            console.log('play');
            if (data.load.isPreloadFinished) {

            } else {
                console.log('play before preload finish');
                data.deferredAction = plugin.play;
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },
        stop(){
            console.log('stop');
            return this;
        },
        togglePlay(){
            console.log('toggled');
            return this;
        },
        next(){
            console.log('next frame');
            if (data.load.isPreloadFinished) {

            } else {
                data.deferredAction = plugin.next;
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },
        prev(){
            console.log('prev frame');
            if (data.load.isPreloadFinished) {

            } else {
                data.deferredAction = plugin.prev;
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },
        setFrame(frameNumber){
            console.log('set frame ' + frameNumber);
            if (data.load.isPreloadFinished) {

            } else {
                data.deferredAction = plugin.setFrame.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },
        playTo(frameNumber){
            console.log('playTo ' + frameNumber);
            if (data.load.isPreloadFinished) {

            } else {
                data.deferredAction = plugin.playTo.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },
        setReverse(reverse = true){
            settings.reverse = !!reverse;
            return this;
        },
        preloadImages(number){
            number = number ?? data.totalImages;
            startLoadingImages(number, { node, settings, data });
            return this;
        },
        reset(){
            console.log('reset');
            if (data.load.isPreloadFinished) {

            } else {
                data.deferredAction = plugin.reset;
                startLoadingImages(data.totalImages, { node, settings, data });
            }
            return this;
        },

        getCurrentFrame: () => data.currentFrame,
        isAnimating: () => data.isAnimating,
        isPreloadFinished: () => data.load.isPreloadFinished,
        destroy(){
            console.log('destroy');
        }
    };

    initPlugin();
    return plugin;
}
