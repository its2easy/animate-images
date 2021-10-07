// TODO make a class from the main plugin module
import { normalizeFrameNumber } from "./utils";
import { validateInitParameters, getDefaultSettings } from "./settings";
import ImagePreloader from "./ImagePreloader";
import Render from "./Render";
import Animation from "./Animation";
import Poster from "./Poster";
import DragInput from "./DragInput";

/**
 * @param {Element|HTMLCanvasElement} node - Canvas DOM Node
 * @param {Object} options - Options
 * @param {Array<String>} options.images - Array with images URLs (required)
 * @param {String} [options.preload="all"] - Preload mode ("all", "none", "partial")
 * @param {Number} [options.preloadNumber=0] - Number of preloaded images when option.preload="partial", 0 for all
 * @param {Number} [options.fps=30] - FPS when playing
 * @param {String} [options.poster] - Url of a poster image, to show before load
 * @param {Boolean} [options.draggable = false] - Draggable by mouse or touch
 * @param {Boolean} [options.loop=false] - Whether to loop the animation
 * @param {Boolean} [options.reverse=false] - Reverse direction
 * @param {Boolean} [options.autoplay=false] - If true, starts the animation automatically on load
 * @param {Number} [options.ratio] - Canvas width/height ratio, it takes precedence over inline canvas width and height
 * @param {String} [options.fillMode="cover"] - Fill mode to use if canvas and image aspect ratios are different. Could be "cover" or "contain"
 * @param {Function} [options.onPreloadFinished] - Occurs when all image files have been loaded
 * @param {Function} [options.onPosterLoaded] - Occurs when poster image is fully loaded
 *
 * @returns {Object} - plugin instance
 */
export function init(node, options = {}) {
    validateInitParameters(node, options);
    let settings = {...getDefaultSettings(), ...options};

    // Plugin state
    let data = {
        currentFrame: 1,
        totalImages: options.images.length,
        loadedImagesArray: [], // images objects [0 - (images.length-1)]
        deferredAction: null, // call after full preload
        isAnyFrameChanged: false,
        pluginApi: {},
        canvas: {
            element: node,
            ratio: null,
        },
    }
    // Classes
    let preloader,
        render,
        animation,
        poster,
        dragInput;


    function initPlugin(){
        render = new Render( {settings, data} );
        animation = new Animation( {settings, data, changeFrame} );
        updateCanvasSizes();
        if ( settings.poster ) setupPoster();
        addResizeHandler(updateCanvasSizes);
        preloader = new ImagePreloader({settings, data, afterPreloadFinishes, updateImagesCount});
        if (settings.preload === 'all' || settings.preload === "partial"){
            let preloadNumber = (settings.preload === 'all') ? data.totalImages : settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = data.totalImages;
            preloader.startLoadingImages(preloadNumber);
        }
        if (settings.autoplay) plugin.play();
        if ( settings.draggable ) toggleDrag(true);
    }

    function afterPreloadFinishes(){ // check what to do next
        node.dispatchEvent( new Event('animate-images:preload-finished') );
        if ("onPreloadFinished" in settings) settings.onPreloadFinished(plugin);
        if (data.deferredAction) data.deferredAction();
    }

    function changeFrame(frameNumber){
        if (frameNumber === data.currentFrame && data.isAnyFrameChanged) return;//skip same frame, except first drawing
        if ( !data.isAnyFrameChanged ) data.isAnyFrameChanged = true;

        animateCanvas(frameNumber);
        data.currentFrame = frameNumber;
    }

    function animateCanvas(frameNumber){
        render.clearCanvas();
        render.drawFrame(frameNumber);
    }


    function updateCanvasSizes(){
        /**
         * If no options.ratio, inline canvas width/height will be used (2:1 if not set)
         * Real canvas size is controlled by CSS, inner size will be set based on CSS width and ratio (height should be "auto")
         * If height if fixed in CSS, ratio can't be used and inner height will be equal to CSS-defined height
         */
        if ( settings.ratio ) data.canvas.ratio = settings.ratio;
        else  data.canvas.ratio = data.canvas.element.width / data.canvas.element.height

        // changing width and height won't change real clientWidth and clientHeight if size is fixed by CSS
        data.canvas.element.width = data.canvas.element.clientWidth;
        data.canvas.element.height = data.canvas.element.width / data.canvas.ratio;

        if (data.canvas.element.height !== data.canvas.element.clientHeight) { // if height set by CSS
            data.canvas.element.height = data.canvas.element.clientHeight;
            data.canvas.ratio = data.canvas.element.width / data.canvas.element.height;
        }
        if ( dragInput ) dragInput.updateThreshold( data.canvas.element.width / data.totalImages )
        maybeRedrawFrame({settings, data});
    }
    function updateImagesCount(){
        if ( dragInput ) dragInput.updateThreshold( data.canvas.element.width / data.totalImages );
        animation.updateDuration();
    }
    function maybeRedrawFrame({settings, data}){
        if ( data.isAnyFrameChanged ) { // frames were drawn
            animateCanvas(data.currentFrame);
        } else if ( poster ) { // poster exists
            poster.redrawPoster();
        }
        // don't redraw in initial state, or if poster onLoad is not finished yet
    }

    function toggleDrag(enable){
        if (enable) {
            if ( !dragInput ) dragInput = new DragInput({
                data,
                changeFrame,
                getNextFrame: animation.getNextFrame.bind(animation)
            });
            dragInput.enableDrag();
        } else {
            if (dragInput) dragInput.disableDrag();
        }
    }

    function setupPoster(){
        if (!poster) poster = new Poster(
            {
                settings,
                data,
                drawFrame: render.drawFrame.bind(render)
            });
        poster.loadAndShowPoster();
    }

    // Pubic API
    let plugin = {
        /**
         * Start animation
         * @returns {Object} - plugin instance
         */
        play(){
            if ( animation.isAnimating ) return;
            if ( preloader.isPreloadFinished() ) {
                animation.play();
            } else {
                data.deferredAction = plugin.play;
                preloader.startLoadingImages(data.totalImages);
            }
            return this;
        },
        /**
         * Stop animation
         * @returns {Object} - plugin instance
         */
        stop(){
            animation.stop();
            return this;
        },
        /**
         * Toggle between start and stop
         * @returns {Object} - plugin instance
         */
        togglePlay(){
            if ( !animation.isAnimating ) plugin.play();
            else plugin.stop();
            return this;
        },
        /**
         * Show next frame
         * @returns {Object} - plugin instance
         */
        next(){
            if ( preloader.isPreloadFinished() ) {
                plugin.stop();
                changeFrame( animation.getNextFrame(1) );
            } else {
                data.deferredAction = plugin.next;
                preloader.startLoadingImages(data.totalImages);
            }
            return this;
        },
        /**
         * Show previous frame
         * @returns {Object} - plugin instance
         */
        prev(){
            if ( preloader.isPreloadFinished() ) {
                plugin.stop();
                changeFrame( animation.getNextFrame(1, !settings.reverse) );
            } else {
                data.deferredAction = plugin.prev;
                preloader.startLoadingImages(data.totalImages);
            }
            return this;
        },
        /**
         * Show a frame with a specified number
         * @param {Number} frameNumber - Number of the frame to show
         * @returns {Object} - plugin instance
         */
        setFrame(frameNumber){
            if ( preloader.isPreloadFinished() ) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(frameNumber, data.totalImages));
            } else {
                data.deferredAction = plugin.setFrame.bind(this, frameNumber);
                preloader.startLoadingImages(data.totalImages);
            }
            return this;
        },
        /**
         * Starts the animation. which plays until the specified frame number
         * @param {Number} frameNumber - Target frame number
         * @returns {Promise<Object>} - Promise, that resolves after animation end
         */
        playTo(frameNumber){
            if ( preloader.isPreloadFinished() ) {
                frameNumber = normalizeFrameNumber(frameNumber, data.totalImages);

                if (frameNumber > data.currentFrame)   plugin.setReverse(false); // move forward
                else  plugin.setReverse(true); // move backward

                return plugin.playFrames(Math.abs(frameNumber - data.currentFrame))
            } else {
                data.deferredAction = plugin.playTo.bind(this, frameNumber);
                preloader.startLoadingImages(data.totalImages);

                animation.setupAnimationPromise(true);
                return animation.animationPromise;
            }
        },
        /**
         * Starts animation in the current direction with the specified number of frames in queue
         * @param {Number} [numberOfFrames=0] - Number of frames to play
         * @returns {Promise<Object>} - Promise, that resolves after animation end
         */
        playFrames(numberOfFrames = 0){
            if ( preloader.isPreloadFinished() ) {
                numberOfFrames = Math.floor(numberOfFrames);
                if (numberOfFrames < 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

                // if this is the 1st animation, we should add 1 frame to the queue to draw the 1st initial frame
                // because 1st frame is not drawn by default
                if (!data.isAnyFrameChanged) numberOfFrames += 1;
                if (numberOfFrames <= 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

                animation.framesLeftToPlay = numberOfFrames;
                plugin.play();

                animation.maybeResolveAnimationPromise(); // resolve old before the new one, if exists
                animation.setupAnimationPromise();
                return animation.animationPromise;
            } else {
                data.deferredAction = plugin.playTo.bind(this, numberOfFrames);
                preloader.startLoadingImages(data.totalImages);

                animation.setupAnimationPromise(true);
                return animation.animationPromise;
            }
        },
        /**
         * Changes reverse option
         * @param {Boolean} reverse
         * @returns @returns {Object} - plugin instance
         */
        setReverse(reverse = true){
            settings.reverse = !!reverse;
            return this;
        },
        /**
         * Start preloading specified number of images
         * @param {Number} number - number of images to load
         * @returns @returns {Object} - plugin instance
         */
        preloadImages(number= undefined){
            number = number ?? data.totalImages;
            preloader.startLoadingImages(number);
            return this;
        },
        /**
         * Calculate new canvas dimensions after the canvas size changed in the browser
         * @returns @returns {Object} - plugin instance
         */
        updateCanvas(){
            updateCanvasSizes();
            return this;
        },
        /**
         * Stop the animation and return to the first frame
         * @returns @returns {Object} - plugin instance
         */
        reset(){
            if ( preloader.isPreloadFinished() ) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(1, data.totalImages));
            } else {
                data.deferredAction = plugin.reset;
                preloader.startLoadingImages(data.totalImages);
            }
            return this;
        },
        /**
         * Stop animation and clear the canvas. Method doesn't remove canvas element from the DOM
         */
        destroy(){
            plugin.stop();
            render.clearCanvas();
            toggleDrag(false);
            removeResizeHandler(updateCanvasSizes);
        },

        /**
         * Returns option value
         * @param {String} option - Option name. Allowed options: fps, draggable, loop, reverse, poster, autoplay, fillMode
         * @returns {*} - Option value
         */
        getOption: (option) => {
            const allowedOptions = ['fps', 'draggable', 'loop', 'reverse', 'draggable', 'poster', 'autoplay', 'fillMode'];
            if (allowedOptions.includes(option)) {
                return settings[option];
            } else {
                console.warn(`${option} is not allowed in getOption`);
            }
        },
        /**
         * Set new option value
         * @param {String} option - Option name. Allowed options: fps, draggable, loop, reverse, ratio, fillMode
         * @param value - new value
         */
        setOption: (option, value) => {
            const allowedOptions = ['fps', 'draggable', 'loop', 'reverse', 'draggable', 'ratio', 'fillMode'];
            if (allowedOptions.includes(option)) {
               settings[option] = value;
               if (option === 'fps') animation.updateDuration();
               if (option === 'ratio') updateCanvasSizes();
               if (option === 'fillMode') updateCanvasSizes();
               if (option === 'draggable') toggleDrag(value);
            } else {
                console.warn(`${option} is not allowed in setOption`);
            }
        },
        getCurrentFrame: () => data.currentFrame,
        getTotalImages:() => data.totalImages,
        getRatio: () => data.canvas.ratio,
        isAnimating: () => animation.isAnimating,
        isPreloadFinished: () => preloader.isPreloadFinished(),
        isLoadedWithErrors: () => preloader.isLoadedWithErrors(),
    };
    data.pluginApi = plugin;

    initPlugin();
    return plugin;
}

function addResizeHandler(cb) {
    window.addEventListener("resize", cb); // todo add debouncing
}
function removeResizeHandler(cb) {
    window.removeEventListener("resize", cb);
}

// todo check raf time instead of performance
// todo check dpr
