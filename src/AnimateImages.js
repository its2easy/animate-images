import { normalizeFrameNumber, uppercaseFirstChar } from "./utils";
import { validateInitParameters, defaultSettings } from "./settings";
import ImagePreloader from "./ImagePreloader";
import Render from "./Render";
import Animation from "./Animation";
import Poster from "./Poster";
import DragInput from "./DragInput";

/**
 * Animate Images {@link https://github.com/its2easy/animate-images/}
 * @example
 * let pluginInstance = new AnimateImages(document.querySelector('canvas'), {
 *    images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
 *    loop: true,
 *    draggable: true,
 *    fps: 60,
 * });
 */
export default class AnimateImages{
    #settings;
    #data = {
        currentFrame: 1,
        totalImages: null,
        loadedImagesArray: [], // images objects [0 - (images.length-1)]
        deferredAction: null, // call after full preload
        isAnyFrameChanged: false,
        /** @type AnimateImages */
        pluginApi: undefined,
        canvas: {
            element: null,
            ratio: null,
        },
    }
    #boundUpdateCanvasSizes;
    //Classes
    #preloader;
    #render;
    #animation;
    #poster;
    #dragInput;

    /**
     * Creates plugin instance
     * @param {HTMLCanvasElement} node - canvas element
     * @param {PluginOptions} options
     */
    constructor(node, options){
        validateInitParameters(node, options);
        this.#settings = {...defaultSettings, ...options};
        this.#data.totalImages = this.#settings.images.length;
        this.#data.canvas.element = node;
        this.#data.pluginApi = this;
        this.#boundUpdateCanvasSizes = this.#updateCanvasSizes.bind(this)
        this.#initPlugin();
    }

    #initPlugin(){
        this.#render = new Render( {settings: this.#settings, data: this.#data} );
        this.#animation = new Animation(
            {settings: this.#settings, data: this.#data, changeFrame:  this.#changeFrame.bind(this)} );
        this.#updateCanvasSizes();
        if ( this.#settings.poster ) this.#setupPoster();
        this.#toggleResizeHandler(true);
        this.#preloader = new ImagePreloader({
            settings: this.#settings,
            data: this.#data,
            updateImagesCount: this.#updateImagesCount.bind(this),
            getFramesLeft: this.#getFramesLeft.bind(this),
        });
        if (this.#settings.preload === 'all' || this.#settings.preload === "partial"){
            let preloadNumber = (this.#settings.preload === 'all') ? this.#data.totalImages : this.#settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = this.#data.totalImages;
            this.#preloader._startLoading(preloadNumber);
        }
        if (this.#settings.autoplay) this.play();
        if ( this.#settings.draggable ) this.#toggleDrag(true);
    }

    #changeFrame(frameNumber){
        if (frameNumber === this.#data.currentFrame && this.#data.isAnyFrameChanged) return;//skip same frame, except first drawing
        if ( !this.#data.isAnyFrameChanged ) this.#data.isAnyFrameChanged = true;

        this.#animateCanvas(frameNumber);
        this.#data.currentFrame = frameNumber;
    }

    #animateCanvas(frameNumber){
        this.#render._clearCanvas();
        this.#render._drawFrame( this.#data.loadedImagesArray[frameNumber - 1] );
    }


    #updateCanvasSizes(){
        const canvas = this.#data.canvas;
        /**
         * +++RATIO SECTION+++
         * If no options.ratio, inline canvas width/height will be used (2:1 if not set)
         * Real canvas size is controlled by CSS, inner size will be set based on CSS width and ratio (height should be "auto")
         * If height if fixed in CSS, ratio can't be used and inner height will be equal to CSS-defined height
         */
        if ( this.#settings.ratio ) canvas.ratio = this.#settings.ratio;
        // Initial ratio shouldn't be changed. Ratio will only modified after setOption("ratio", newRatio),
        // or after setting css height and plugin.updateCanvas()
        else if ( !canvas.ratio ) {
            canvas.ratio = canvas.element.width / canvas.element.height;
        }


        // +++SIZE SECTION+++
        // mainSide is the side from responsiveAspect, it should be controlled by CSS, secondarySide value will be
        // controlled by script
        const dpr = (window.devicePixelRatio).toFixed(2) || 1; // sometimes dpr is like 2.00000000234
        let mainSide = this.#settings.responsiveAspect;// width or height
        let clientMainSide =  "client" + uppercaseFirstChar(mainSide); // clientWidth or clientHeight
        let secondarySide = (mainSide === "width") ? "height" : "width";
        let clientSecondarySide = "client" + uppercaseFirstChar(secondarySide);// clientWidth or clientHeight

        // changing width and height won't change real clientWidth and clientHeight if size is fixed by CSS
        const initialClientMainSide = canvas.element[clientMainSide];
        canvas.element[mainSide] = canvas.element[clientMainSide] * dpr;

        // !!! ONLY if dpr != 1 and canvas css mainSide was not defined => changed width will change clientWidth
        // so we need to recalculate width based on new clientWidth
        if (initialClientMainSide !== canvas.element[clientMainSide]) {
            canvas.element[mainSide] = canvas.element[clientMainSide] * dpr;
        }

        let rawNewValue = (mainSide === "width") ? canvas.element.clientWidth / canvas.ratio : canvas.element.clientHeight * canvas.ratio;
        canvas.element[secondarySide] = Math.round(rawNewValue) * dpr; // "round" for partial fix to rounding pixels error


        // +++CORRECTION SECTION+++
        const secondaryValueDifference = Math.abs(canvas.element[secondarySide] - canvas.element[clientSecondarySide] * dpr);// diff in pixels
        // previously I compared with 1px to check subpixel errors, but error is somehow related to dpr, so we compare with "1px * dpr" or just "dpr"
        if ( secondaryValueDifference > dpr) { // if secondarySide is locked by CSS
            let newRatio = canvas.element.clientWidth / canvas.element.clientHeight; // ratio from "real" canvas element
            // <1% change => calculation error; >1% change => secondarySide size is locked with css
            if ( Math.abs(canvas.ratio - newRatio) / canvas.ratio > 0.01 ) {
                canvas.element[secondarySide] = canvas.element[clientSecondarySide] * dpr;
                canvas.ratio = newRatio;
            } else { // small diff between inner and real values, adjust to prevent errors accumulation
                canvas.element[secondarySide] = (mainSide === "width") ? canvas.element.width / canvas.ratio : canvas.element.height * canvas.ratio;
            }
        } else if (secondaryValueDifference > 0 && secondaryValueDifference <= dpr ) { // rare case, pixels are fractional
            // so just update inner canvas size baser on main side and ratio
            canvas.element[secondarySide] = (mainSide === "width") ? canvas.element.width / canvas.ratio : canvas.element.height * canvas.ratio;
        }

        if ( this.#dragInput ) this.#dragInput._updateThreshold()
        this.#maybeRedrawFrame(); // canvas is clear after resize
    }

    #updateImagesCount(){
        if ( this.#dragInput ) this.#dragInput._updateThreshold();
        this.#animation._updateDuration();
    }
    #maybeRedrawFrame(){
        if ( this.#data.isAnyFrameChanged ) { // frames were drawn
            this.#animateCanvas(this.#data.currentFrame);
        } else if ( this.#poster ) { // poster exists
            this.#poster._redrawPoster();
        }
        // don't redraw in initial state, or if poster onLoad is not finished yet
    }

    #toggleDrag(enable){
        if (enable) {
            if ( !this.#dragInput ) this.#dragInput = new DragInput({
                data: this.#data,
                settings: this.#settings,
                changeFrame: this.#changeFrame.bind(this),
                getNextFrame: this.#animation._getNextFrame.bind(this.#animation)
            });
            this.#dragInput._enableDrag();
        } else {
            if (this.#dragInput) this.#dragInput._disableDrag();
        }
    }

    #setupPoster(){
        if (!this.#poster) this.#poster = new Poster(
            {
                settings: this.#settings,
                data: this.#data,
                drawFrame: this.#render._drawFrame.bind(this.#render)
            });
        this.#poster._loadAndShowPoster();
    }

    #toggleResizeHandler(add = true) {
        if ( add ) window.addEventListener("resize", this.#boundUpdateCanvasSizes);
        else window.removeEventListener("resize", this.#boundUpdateCanvasSizes);
    }

    #getFramesLeft(){
        return this.#animation._framesLeftToPlay;
    }

    // Pubic API

    /**
     * Start animation
     * @returns {AnimateImages} - plugin instance
     */
    play(){
        if ( this.#animation._isAnimating ) return this;
        if ( this.#preloader._isAnyPreloadFinished ) {
            this.#animation._play();
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.play.bind(this);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Stop animation
     * @returns {AnimateImages} - plugin instance
     */
    stop(){
        this.#animation._stop();
        return this;
    }
    /**
     * Toggle between start and stop
     * @returns {AnimateImages} - plugin instance
     */
    toggle(){
        if ( !this.#animation._isAnimating ) this.play();
        else this.stop();
        return this;
    }
    /**
     * Show next frame
     * @returns {AnimateImages} - plugin instance
     */
    next(){
        if ( this.#preloader._isAnyPreloadFinished ) {
            this.stop();
            this.#changeFrame( this.#animation._getNextFrame(1) );
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.next.bind(this);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Show previous frame
     * @returns {AnimateImages} - plugin instance
     */
    prev(){
        if ( this.#preloader._isAnyPreloadFinished ) {
            this.stop();
            this.#changeFrame( this.#animation._getNextFrame(1, !this.#settings.reverse) );
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.prev.bind(this);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Show a frame with a specified number (without animation)
     * @param {number} frameNumber - Number of the frame to show
     * @returns {AnimateImages} - plugin instance
     */
    setFrame(frameNumber){
        if ( this.#preloader._isAnyPreloadFinished ) {
            this.stop();
            this.#changeFrame(normalizeFrameNumber(frameNumber, this.#data.totalImages));
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.setFrame.bind(this, frameNumber);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Start animation, that plays until the specified frame number
     * @param {number} frameNumber - Target frame number
     * @param {Object} [options] - Options
     * @param {boolean} [options.shortestPath=false] - If set to true and loop enabled, will use the shortest path
     * @returns {AnimateImages} - plugin instance
     */
    playTo(frameNumber, options){
        frameNumber = normalizeFrameNumber(frameNumber, this.#data.totalImages);

        const innerPathDistance = Math.abs(frameNumber - this.#data.currentFrame), // not crossing edge frames
            outerPathDistance = this.#data.totalImages - innerPathDistance, // crossing edges frames
            shouldUseOuterPath = this.#settings.loop && options?.shortestPath && (outerPathDistance < innerPathDistance);

        if ( !shouldUseOuterPath ) { // Inner path (default)
            // long conditions to make them more readable
            if (frameNumber > this.#data.currentFrame) this.setReverse(false); // move forward
            else this.setReverse(true); // move backward
        } else { // Outer path
            if (frameNumber < this.#data.currentFrame) this.setReverse(false); // move forward
            else this.setReverse(true); // move backward
        }

        return this.playFrames( (shouldUseOuterPath) ? outerPathDistance : innerPathDistance );
    }
    /**
     * Start animation in the current direction with the specified number of frames in the queue
     * @param {number} [numberOfFrames=0] - Number of frames to play
     * @returns {AnimateImages} - plugin instance
     */
    playFrames(numberOfFrames = 0){
        if ( this.#preloader._isAnyPreloadFinished ) {
            numberOfFrames = Math.floor(numberOfFrames);
            if (numberOfFrames < 0) { // first frame should be rendered to replace poster or transparent bg, so allow 0 for the first time
                return this.stop(); //empty animation, stop() to trigger events and callbacks
            }

            // if this is the 1st animation, we should add 1 frame to the queue to draw the 1st initial frame
            // because 1st frame is not drawn by default (1 frame will replace poster or transparent bg)
            if (!this.#data.isAnyFrameChanged) numberOfFrames += 1;
            if (numberOfFrames <= 0) { // with playFrames(0) before any actions numberOfFrames=1, after any frame change numberOfFrames=0
                return this.stop(); //empty animation
            }

            this.#animation._framesLeftToPlay = numberOfFrames;
            this.play();
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.playFrames.bind(this, numberOfFrames);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Change the direction of the animation. Alias to <b>setOption('reverse', true)</b>
     * @param {boolean} [reverse=true] - true for backward animation, false for forward, default "true"
     * @returns {AnimateImages} - plugin instance
     */
    setReverse(reverse = true){
        this.#settings.reverse = !!reverse;
        return this;
    }
    /**
     * Get current reverse option. Alias to <b>getOption('reverse')</b>
     * @returns {boolean} - reverse or not
     */
    getReverse() { return this.#settings.reverse; }
    /**
     * Change the direction of the animation. It does the opposite effect of <b>setReverse()</b>
     * @param {boolean} [forward=true] - true for forward animation, false for backward, default "true"
     * @returns {AnimateImages} - plugin instance
     */
    setForward(forward = true){
        this.#settings.reverse = !forward;
        return this;
    }
    /**
     * Start preload specified number of images, can be called multiple times.
     * If all the images are already loaded, then nothing will happen
     * @param {number} number - Number of images to load. If not specified, all remaining images will be loaded.
     * @returns {AnimateImages} - plugin instance
     */
    preloadImages(number= undefined){
        number = number ?? this.#settings.images.length;
        this.#preloader._startLoading(number);
        return this;
    }
    /**
     * Calculate new canvas dimensions. Should be called after the canvas size was changed manually
     * Called automatically after page resize
     * @returns {AnimateImages} - plugin instance
     */
    updateCanvas(){
        this.#updateCanvasSizes();
        return this;
    }
    /**
     * Returns option value
     * @param {string} option - Option name. All options are allowed
     * @returns {*} - Current option value
     */
    getOption(option){
        if ( option in this.#settings ) {
            return this.#settings[option];
        } else {
            console.warn(`${option} is not a valid option`);
        }
    }
    /**
     * Set new option value
     * @param {string} option - Option name. Allowed options: fps, loop, reverse, inversion, ratio, fillMode, draggable, dragModifier,
     * touchScrollMode, pageScrollTimerDelay, onPreloadFinished, onPosterLoaded, onAnimationEnd, onBeforeFrame, onAfterFrame
     * @param {*} value - New value
     * @returns {AnimateImages} - plugin instance
     */
    setOption(option, value) {
        const allowedOptions = ['fps', 'loop', 'reverse', 'inversion', 'ratio', 'fillMode', 'draggable', 'dragModifier', 'touchScrollMode',
            'pageScrollTimerDelay', 'onPreloadFinished', 'onFastPreloadFinished', 'onPosterLoaded', 'onAnimationEnd', 'onBeforeFrame', 'onAfterFrame'];
        if (allowedOptions.includes(option)) {
           this.#settings[option] = value;
           if (option === 'fps') this.#animation._updateDuration();
           if (option === 'ratio') this.#updateCanvasSizes();
           if (option === 'fillMode') this.#updateCanvasSizes();
           if (option === 'draggable') this.#toggleDrag(value);
           if (option === 'dragModifier') this.#settings.dragModifier = Math.abs(+value);
        } else {
            console.warn(`${option} is not allowed in setOption`);
        }
        return this;
    }
    /** @returns {number} - current frame number */
    getCurrentFrame() { return this.#data.currentFrame }
    /** @returns {number} - total frames (considering loading errors) */
    getTotalImages() { return this.#data.totalImages }
    /** @returns {number} - current canvas ratio */
    getRatio() { return this.#data.canvas.ratio }
    /** @returns {boolean} - animating or not */
    isAnimating() { return this.#animation._isAnimating }
    /** @returns {boolean} - returns true if a drag action is in progress */
    isDragging() {
        if ( this.#dragInput ) return this.#dragInput._isSwiping;
        return false
    }
    /** @returns {boolean} - is preload finished */
    isPreloadFinished() { return this.#preloader._isPreloadFinished }
    /** @returns {boolean} - is fast preview mode preload finished */
    isFastPreloadFinished() { return this.#preloader._isFastPreloadFinished }
    /** @returns {boolean} - is loaded with errors */
    isLoadedWithErrors() { return this.#preloader._isLoadedWithErrors }

    /**
     * Stop the animation and return to the first frame
     * @returns {AnimateImages} - plugin instance
     */
    reset(){
        if ( this.#preloader._isAnyPreloadFinished ) {
            this.stop();
            this.#changeFrame(normalizeFrameNumber(1, this.#data.totalImages));
            this.#preloader._maybePreloadAll();
        } else {
            this.#data.deferredAction = this.reset.bind(this);
            this.#preloader._startLoading();
        }
        return this;
    }
    /**
     * Stop animation, remove event listeners and clear the canvas. Method doesn't remove canvas element from the DOM
     */
    destroy(){
        this.stop();
        this.#render._clearCanvas();
        this.#toggleDrag(false);
        this.#toggleResizeHandler(false);
    }
}
/**
 * NOTE
 * All internal classes have public methods and properties start with _, that's for terser plugin that can mangle internal names
 * by regexp. It's reducing size by about 20%. Private (#) properties are not used in internal classes because babel use wrapper
 * functions for these properties, which increases the size even though private names are minified
 */

/**
 * @typedef {Object} PluginOptions
 * @property {Array<string>} images - Array with images URLs (required)
 * @property {'all'|'partial'|'none'} [preload="all"] - Preload mode ("all", "none", "partial")
 * @property {number} [preloadNumber=0] - Number of preloaded images when <b>preload: "partial"</b>, 0 for all
 * @property {string} [poster] - Url of a poster image, to show before load
 * @property {number} [fps=30] - FPS when playing. Determines the duration of the animation (for example 90 images and 60
 * fps = 1.5s, 90 images and 30fps = 3s)
 * @property {boolean} [loop=false] - Loop the animation
 * @property {boolean} [autoplay=false] - Autoplay
 * @property {boolean} [reverse=false] - Reverse direction
 * reverse means forward or backward, and inversion determines which direction is forward. Affects animation and drag
 * @property {number} [ratio] - Canvas width/height ratio, it has higher priority than inline canvas width and height
 * @property {'cover'|'contain'} [fillMode="cover"] - Fill mode to use if canvas and image aspect ratios are different
 * ("cover" or "contain")
 * @property {boolean} [draggable=false] - Draggable by mouse or touch
 * @property {boolean} [inversion=false] - Inversion changes drag direction
 * @property {number} [dragModifier=1] - Sensitivity factor for user interaction. Only positive numbers are allowed
 * @property {'pageScrollTimer' | 'preventPageScroll' | 'allowPageScroll'} [touchScrollMode = "pageScrollTimer"] - Page
 * scroll behavior with touch events (preventPageScroll,allowPageScroll, pageScrollTimer)
 * @property {number} [pageScrollTimerDelay=1500] - Time in ms when touch scroll will be disabled during interaction
 * if <b>touchScrollMode: "pageScrollTimer"<b>
 * @property {'width'|'height'} [responsiveAspect="width"] - Which side will be responsive (controlled by css)
 * @property {Object|false} [fastPreview=false] - Special mode for interactivity after loading only a part of the pictures
 * @property {Array<string>} [fastPreview.images] - images urls for fastPreview mode (<b>Required</b> if fastPreview is enabled)
 * @property {number} [fastPreview.fpsAfter] - fps value that will be applied after the full list of images is loaded
 * @property {function(number):number} [fastPreview.matchFrame] - A function that takes the frame number of the short set
 * and returns the frame number of the full set, to prevent jump after full load.
 * @property {function(AnimateImages):void} [onPreloadFinished] - Occurs when all image files have been loaded
 * @property {function(AnimateImages):void} [onFastPreloadFinished] - Occurs when all fastPreview mode images have been loaded
 * @property {function(AnimateImages):void} [onPosterLoaded] - Occurs when poster image is fully loaded
 * @property {function(AnimateImages):void} [onAnimationEnd] - Occurs when animation has ended
 * @property {function(AnimateImages, FrameInfo):void} [onBeforeFrame] - Occurs before new frame
 * @property {function(AnimateImages, FrameInfo):void} [onAfterFrame] - Occurs after the frame was drawn
 */

/**
 * @typedef {Object} FrameInfo
 * @property {CanvasRenderingContext2D} context - canvas context
 * @property {number} width - internal canvas width
 * @property {number} height - internal canvas height
 * */
