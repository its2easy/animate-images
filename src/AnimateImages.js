import { normalizeFrameNumber } from "./utils";
import { validateInitParameters, defaultSettings } from "./settings";
import ImagePreloader from "./ImagePreloader";
import Render from "./Render";
import Animation from "./Animation";
import Poster from "./Poster";
import DragInput from "./DragInput";


export default class AnimateImages{
    #settings;
    #data = {
        currentFrame: 1,
        totalImages: null,
        loadedImagesArray: [], // images objects [0 - (images.length-1)]
        deferredAction: null, // call after full preload
        isAnyFrameChanged: false,
        pluginApi: {},
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
        this.#data.totalImages = options.images.length;
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
        });
        if (this.#settings.preload === 'all' || this.#settings.preload === "partial"){
            let preloadNumber = (this.#settings.preload === 'all') ? this.#data.totalImages : this.#settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = this.#data.totalImages;
            this.#preloader.startLoadingImages(preloadNumber);
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
        this.#render.clearCanvas();
        this.#render.drawFrame(frameNumber);
    }


    #updateCanvasSizes(){
        /**
         * If no options.ratio, inline canvas width/height will be used (2:1 if not set)
         * Real canvas size is controlled by CSS, inner size will be set based on CSS width and ratio (height should be "auto")
         * If height if fixed in CSS, ratio can't be used and inner height will be equal to CSS-defined height
         */
        if ( this.#settings.ratio ) this.#data.canvas.ratio = this.#settings.ratio;
        // Initial ratio shouldn't be changed. Ratio will only modified after setOption("ratio", newRatio),
        // or after setting css height and plugin.updateCanvas()
        else if ( !this.#data.canvas.ratio ) {
            this.#data.canvas.ratio = this.#data.canvas.element.width / this.#data.canvas.element.height;
        }

        let dpr = window.devicePixelRatio || 1;
        // changing width and height won't change real clientWidth and clientHeight if size is fixed by CSS
        let initialClientWidth = this.#data.canvas.element.clientWidth;
        this.#data.canvas.element.width = this.#data.canvas.element.clientWidth * dpr;
        // if canvas css width was not defined, clientWidth was changed based on new width, we need to recalculate width based on new clientWidth
        if (initialClientWidth !== this.#data.canvas.element.clientWidth) {
            this.#data.canvas.element.width = this.#data.canvas.element.clientWidth * dpr;
        }
        this.#data.canvas.element.height = Math.round(this.#data.canvas.element.clientWidth / this.#data.canvas.ratio) * dpr; // "round" for partial fix to rounding pixels error

        let heightDifference = Math.abs(this.#data.canvas.element.height - this.#data.canvas.element.clientHeight * dpr);// diff in pixels
        if ( heightDifference >= 1) { // if height set by CSS
            this.#data.canvas.element.height = this.#data.canvas.element.clientHeight * dpr;
            this.#data.canvas.ratio = this.#data.canvas.element.width / this.#data.canvas.element.height;
        } else if (heightDifference > 0 && heightDifference <1 ) { // rare case, height is auto, but pixels are fractional
            this.#data.canvas.element.height = this.#data.canvas.element.clientHeight * dpr; // so just update inner canvas size baser on rounded real height
        }

        if ( this.#dragInput ) this.#dragInput.updateThreshold()
        this.#maybeRedrawFrame(); // canvas is clear after resize
    }

    #updateImagesCount(){
        if ( this.#dragInput ) this.#dragInput.updateThreshold();
        this.#animation.updateDuration();
    }
    #maybeRedrawFrame(){
        if ( this.#data.isAnyFrameChanged ) { // frames were drawn
            this.#animateCanvas(this.#data.currentFrame);
        } else if ( this.#poster ) { // poster exists
            this.#poster.redrawPoster();
        }
        // don't redraw in initial state, or if poster onLoad is not finished yet
    }

    #toggleDrag(enable){
        if (enable) {
            if ( !this.#dragInput ) this.#dragInput = new DragInput({
                data: this.#data,
                settings: this.#settings,
                changeFrame: this.#changeFrame.bind(this),
                getNextFrame: this.#animation.getNextFrame.bind(this.#animation)
            });
            this.#dragInput.enableDrag();
        } else {
            if (this.#dragInput) this.#dragInput.disableDrag();
        }
    }

    #setupPoster(){
        if (!this.#poster) this.#poster = new Poster(
            {
                settings: this.#settings,
                data: this.#data,
                drawFrame: this.#render.drawFrame.bind(this.#render)
            });
        this.#poster.loadAndShowPoster();
    }

    #toggleResizeHandler(add = true) {
        if ( add ) window.addEventListener("resize", this.#boundUpdateCanvasSizes);
        else window.removeEventListener("resize", this.#boundUpdateCanvasSizes);
    }

    // Pubic API

    /**
     * Start animation
     * @returns {AnimateImages} - plugin instance
     */
    play(){
        if ( this.#animation.isAnimating ) return this;
        if ( this.#preloader.isPreloadFinished() ) {
            this.#animation.play();
        } else {
            this.#data.deferredAction = this.play.bind(this);
            this.#preloader.startLoadingImages();
        }
        return this;
    }
    /**
     * Stop animation
     * @returns {AnimateImages} - plugin instance
     */
    stop(){
        this.#animation.stop();
        return this;
    }
    /**
     * Toggle between start and stop
     * @returns {AnimateImages} - plugin instance
     */
    toggle(){
        if ( !this.#animation.isAnimating ) this.play();
        else this.stop();
        return this;
    }
    /**
     * Show next frame
     * @returns {AnimateImages} - plugin instance
     */
    next(){
        if ( this.#preloader.isPreloadFinished() ) {
            this.stop();
            this.#changeFrame( this.#animation.getNextFrame(1) );
        } else {
            this.#data.deferredAction = this.next.bind(this);
            this.#preloader.startLoadingImages();
        }
        return this;
    }
    /**
     * Show previous frame
     * @returns {AnimateImages} - plugin instance
     */
    prev(){
        if ( this.#preloader.isPreloadFinished() ) {
            this.stop();
            this.#changeFrame( this.#animation.getNextFrame(1, !this.#settings.reverse) );
        } else {
            this.#data.deferredAction = this.prev.bind(this);
            this.#preloader.startLoadingImages();
        }
        return this;
    }
    /**
     * Show a frame with a specified number (without animation)
     * @param {number} frameNumber - Number of the frame to show
     * @returns {AnimateImages} - plugin instance
     */
    setFrame(frameNumber){
        if ( this.#preloader.isPreloadFinished() ) {
            this.stop();
            this.#changeFrame(normalizeFrameNumber(frameNumber, this.#data.totalImages));
        } else {
            this.#data.deferredAction = this.setFrame.bind(this, frameNumber);
            this.#preloader.startLoadingImages();
        }
        return this;
    }
    /**
     * Start animation. that plays until the specified frame number
     * @param {number} frameNumber - Target frame number
     * @returns {Promise<AnimateImages>} - Promise, that resolves after the animation end
     */
    playTo(frameNumber){
        frameNumber = normalizeFrameNumber(frameNumber, this.#data.totalImages);
        if (frameNumber > this.#data.currentFrame)   this.setReverse(false); // move forward
        else  this.setReverse(true); // move backward

        return this.playFrames(Math.abs(frameNumber - this.#data.currentFrame))
    }
    /**
     * Start animation in the current direction with the specified number of frames in queue
     * @param {number} [numberOfFrames=0] - Number of frames to play
     * @returns {Promise<AnimateImages>} - Promise, that resolves after the animation end
     */
    playFrames(numberOfFrames = 0){
        if ( this.#preloader.isPreloadFinished() ) {
            numberOfFrames = Math.floor(numberOfFrames);
            if (numberOfFrames < 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

            // if this is the 1st animation, we should add 1 frame to the queue to draw the 1st initial frame
            // because 1st frame is not drawn by default
            if (!this.#data.isAnyFrameChanged) numberOfFrames += 1;
            if (numberOfFrames <= 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

            this.#animation.framesLeftToPlay = numberOfFrames;
            this.play();

            this.#animation.maybeResolveAnimationPromise(); // resolve old before the new one, if exists
            this.#animation.setupAnimationPromise();
            return this.#animation.animationPromise;
        } else {
            this.#data.deferredAction = this.playTo.bind(this, numberOfFrames);
            this.#preloader.startLoadingImages();

            this.#animation.setupAnimationPromise(true);
            return this.#animation.animationPromise;
        }
    }
    /**
     * Change the direction of the animation. Alias to setOption('reverse', true)
     * @param {boolean} reverse
     * @returns {AnimateImages} - plugin instance
     */
    setReverse(reverse = true){
        this.#settings.reverse = !!reverse;
        return this;
    }
    /** Get current reverse option. Alias to getOption('reverse')
     * @returns {boolean} - reverse or not
     */
    getReverse() { return this.#settings.reverse; }
    /**
     * Start preloading specified number of images
     * @param {number} number - number of images to load
     * @returns {AnimateImages} - plugin instance
     */
    preloadImages(number= undefined){
        number = number ?? this.#data.totalImages;
        this.#preloader.startLoadingImages(number);
        return this;
    }
    /**
     * Calculate new canvas dimensions after the canvas size changed in the browser
     * @returns {AnimateImages} - plugin instance
     */
    updateCanvas(){
        this.#updateCanvasSizes();
        return this;
    }
    /**
     * Returns option value
     * @param {string} option - Option name. All options are allowed
     * @returns {*} - current option value
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
     * @param {string} option - Option name. Allowed options: fps, loop, reverse, inversion, ratio, fillMode, draggable,
     * touchScrollMode, pageScrollTimerDelay, onPreloadFinished, onPosterLoaded, onBeforeFrame, onAfterFrame
     * @param {*} value - new value
     * @returns {AnimateImages} - plugin instance
     */
    setOption(option, value) {
        const allowedOptions = ['fps', 'loop', 'reverse', 'inversion', 'ratio', 'fillMode', 'draggable', 'touchScrollMode',
            'pageScrollTimerDelay', 'onPreloadFinished', 'onPosterLoaded', 'onBeforeFrame', 'onAfterFrame'];
        if (allowedOptions.includes(option)) {
           this.#settings[option] = value;
           if (option === 'fps') this.#animation.updateDuration();
           if (option === 'ratio') this.#updateCanvasSizes();
           if (option === 'fillMode') this.#updateCanvasSizes();
           if (option === 'draggable') this.#toggleDrag(value);
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
    isAnimating() { return this.#animation.isAnimating }
    /** @returns {boolean} - is preload finished */
    isPreloadFinished() { return this.#preloader.isPreloadFinished() }
    /** @returns {boolean} - is loaded with errors */
    isLoadedWithErrors() { return this.#preloader.isLoadedWithErrors() }

    /**
     * Stop the animation and return to the first frame
     * @returns {AnimateImages} - plugin instance
     */
    reset(){
        if ( this.#preloader.isPreloadFinished() ) {
            this.stop();
            this.#changeFrame(normalizeFrameNumber(1, this.#data.totalImages));
        } else {
            this.#data.deferredAction = this.reset.bind(this);
            this.#preloader.startLoadingImages();
        }
        return this;
    }
    /**
     * Stop animation and clear the canvas. Method doesn't remove canvas element from the DOM
     */
    destroy(){
        this.stop();
        this.#render.clearCanvas();
        this.#toggleDrag(false);
        this.#toggleResizeHandler(false);
    }
}


/**
 * @typedef {Object} PluginOptions
 * @property {Array.<string>} images - Array with images URLs (required)
 * @property {string} [preload="all"] - Preload mode ("all", "none", "partial")
 * @property {number} [preloadNumber=0] - Number of preloaded images when option.preload="partial", 0 for all
 * @property {string} [poster] - Url of a poster image, to show before load
 * @property {number} [fps=30] - FPS when playing
 * @property {boolean} [loop=false] - Whether to loop the animation
 * @property {boolean} [reverse=false] - Reverse direction
 * @property {boolean} [inversion=false] - Inversion defines base direction. It differs from reverse in that
 * reverse means forward or backward, and inversion determines which direction is forward. Affects animation and drag
 * @property {boolean} [autoplay=false] - If true, starts the animation automatically on load
 * @property {number} [ratio] - Canvas width/height ratio, it takes precedence over inline canvas width and height
 * @property {string} [fillMode="cover"] - Fill mode to use if canvas and image aspect ratios are different. Could be "cover" or "contain"
 * @property {Boolean} [draggable = false] - Draggable by mouse or touch
 * @property {string} [touchScrollMode = "pageScrollTimer"] - Page scroll behavior with touch events
 * (preventPageScroll,allowPageScroll, pageScrollTimer)
 * @property {number} [pageScrollTimerDelay = 1500] - Time in ms when touch scroll will be disabled during interaction
 * if touchScrollMode = "pageScrollTimer"
 * @property {OnPreloadFinishedCallback} [onPreloadFinished] - Occurs when all image files have been loaded
 * @property {Function} [onPosterLoaded] - Occurs when poster image is fully loaded
 * @property {Function} [onBeforeFrame] - Occurs before new frame (CanvasRenderingContext2D)
 * @property {Function} [onAfterFrame] - Occurs after the frame was drawn
 */


/**
 * @callback OnPreloadFinishedCallback
 * @param {this} responseCode
 */
