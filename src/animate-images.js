import { normalizeFrameNumber, calculateFullAnimationDuration } from "./utils";
import { validateInitParameters, getDefaultSettings, SWIPE_EVENTS } from "./settings";
import { startLoadingImages } from "./preload";
import { maybeShowPoster } from "./poster";
import { clearCanvas, drawFrame } from "./render";

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

    let data = {
        currentFrame: 1,
        isAnimating: false,
        totalImages: options.images.length,
        loadedImagesArray: [], // images objects [0 - (images.length-1)]
        deferredAction: null, // call after full preload
        isAnyFrameChanged: false,
        animation: {
            lastUpdate: 0, //time from RAF
            duration: calculateFullAnimationDuration(settings),// time of the full animation sequence
            framesLeftToPlay: undefined, // frames from playTo() and playFrames()
            deltaFrames: 1, // frame change step
            animationPromise: null,
            animationPromiseResolve: null,
            stopRequested: false,
        },
        poster: {
            imageObject: null,
            isPosterLoaded: false,
        },
        load: {
            isPreloadFinished: false, // onload on all the images
            preloadOffset: 0, // images already in queue
            preloadedImagesNumber: 0, // count of loaded images
            isLoadWithErrors: false,
            onLoadFinishedCB: afterPreloadFinishes,
        },
        canvas: {
            element: node,
            /** @type CanvasRenderingContext2D */
            context: null,
            ratio: null,
            imageWidth: null,
            imageHeight: null,
        },
        swipe: {
            curX: null,
            curY: null,
            prevX: null,
            prevY: null,
            isSwiping: false,
            threshold: null,
            pixelsCorrection: 0,
        }
    }

    //===================== SWIPE ROTATION ====================//
    function swipeHandler(event){
        // get current click/touch point
        let touches;
        if ( event.touches !== undefined && event.touches.length ) touches = event.touches;
        data.swipe.curX = (touches) ? touches[0].pageX : event.clientX;
        data.swipe.curY = (touches) ? touches[0].pageY : event.clientY;

        switch (event.type){
            case 'mousedown': // start
            case 'touchstart':
                if ( event.type === 'touchstart') event.preventDefault();
                document.addEventListener('mouseup', swipeHandler); // move outside of the canvas
                document.addEventListener('mousemove', swipeHandler);
                swipeStart();
                break;
            case 'mousemove':
            case 'touchmove': //move
                if ( event.type === 'touchmove') event.preventDefault();
                if ( data.swipe.isSwiping ) swipeMove();
                break;
            case 'mouseup':
            case 'touchend':
            case 'touchcancel': // end
                if ( event.type === 'touchend' || event.type === 'touchcancel') event.preventDefault();
                document.removeEventListener('mouseup', swipeHandler);
                document.removeEventListener('mousemove', swipeHandler);
                swipeEnd();
                break;
        }
    }
    function swipeStart(){
        if ( !data.load.isPreloadFinished ) return;
        plugin.stop();
        data.swipe.isSwiping = true;
        node.style.cursor = 'grabbing';
        data.swipe.prevX = data.swipe.curX;
        data.swipe.prevY = data.swipe.curY;
    }
    function swipeMove(){
        const direction = swipeDirection();
        data.swipe.prevY = data.swipe.curY; // Update Y to get right angle

        const swipeLength = Math.round( Math.abs(data.swipe.curX - data.swipe.prevX) ) + data.swipe.pixelsCorrection;
        if ( swipeLength <= data.swipe.threshold) return; // Ignore if less than 1 frame
        if ( direction !== 'left' && direction !== 'right') return; // Ignore vertical directions
        data.swipe.prevX = data.swipe.curX;

        const progress = swipeLength / data.canvas.element.width; // full width swipe means full animation
        const deltaFrames = Math.floor(progress * data.totalImages);
        // Add pixels to the next swipeMove if frames equivalent of swipe is not an integer number,
        // e.g one frame is 10px, swipeLength is 13px, we change 1 frame and add 3px to the next swipe,
        // so fullwidth swipe is always rotate sprite for 1 turn
        data.swipe.pixelsCorrection = swipeLength - (data.swipe.threshold * deltaFrames);
        changeFrame(getNextFrame( deltaFrames, (direction === 'left') )); // left means backward (reverse: true)
    }
    function swipeEnd(){
        //if ( swipeObject.curX === undefined ) return; // there is no x coord on touch end
        data.swipe.curX = data.swipe.curY = data.swipe.prevX = data.swipe.prevY = null;
        data.swipe.isSwiping = false;
        node.style.cursor = null;
    }
    function swipeDirection(){
        let xDist, yDist, r, swipeAngle;
        xDist = data.swipe.prevX - data.swipe.curX;
        yDist = data.swipe.prevY - data.swipe.curY;
        r = Math.atan2(yDist, xDist);
        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);
        if ( (swipeAngle >= 0 && swipeAngle <= 60) || (swipeAngle <= 360 && swipeAngle >= 300 )) return 'left';
        else if ( swipeAngle >= 120 && swipeAngle <= 240 ) return 'right';
        else if ( swipeAngle >= 241 && swipeAngle <= 299 ) return 'bottom';
        else return 'up';
    }
    //===================== END SWIPE ====================//

    function setupSwipeEvents(node, swipeHandler, swipeEvents) {
        swipeEvents.forEach( (value) => {
            node.addEventListener(value, swipeHandler);
        })
    }
    function removeSwipeEvents(node, swipeHandler, swipeEvents) {
        swipeEvents.forEach( (value) => {
            node.removeEventListener(value, swipeHandler);
        })
        document.removeEventListener('mouseup', swipeHandler);
        document.removeEventListener('mousemove', swipeHandler);
    }

    function initPlugin(){
        data.canvas.context = data.canvas.element.getContext("2d");
        updateCanvasSizes();
        data.animation.lastUpdate = performance.now();
        maybeShowPoster({settings, data, drawFrame, updateImageSizes});
        addResizeHandler(updateCanvasSizes);
        if (settings.preload === 'all' || settings.preload === "partial"){
            let preloadNumber = (settings.preload === 'all') ? data.totalImages : settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = data.totalImages;
            startLoadingImages(preloadNumber, { settings, data });
        }
        if (settings.autoplay) plugin.play();
        if ( settings.draggable ) {
            setupSwipeEvents(node, swipeHandler, SWIPE_EVENTS);
        }
    }

    function afterPreloadFinishes(){ // check what to do next
        updateImageSizes(data.loadedImagesArray[0], true);
        node.dispatchEvent( new Event('animate-images:preload-finished') );
        if ("onPreloadFinished" in settings) settings.onPreloadFinished(plugin);
        if (data.deferredAction) data.deferredAction();
    }


    function changeFrame(frameNumber){
        if (frameNumber === data.currentFrame && data.isAnyFrameChanged) return;//skip same frame, except first draw
        if ( !data.isAnyFrameChanged ) data.isAnyFrameChanged = true;

        animateCanvas(frameNumber);
        if (typeof data.animation.framesLeftToPlay !== 'undefined') {
            data.animation.framesLeftToPlay = data.animation.framesLeftToPlay - data.animation.deltaFrames;
        }
        data.currentFrame = frameNumber;
    }

    // works inside RAF
    function animate(time){
        // if 0 frames left, stop immediately, don't wait for the next frame calculation
        // because if isAnimating become true, this will be a new animation
        if ( typeof data.animation.framesLeftToPlay !== 'undefined' && data.animation.framesLeftToPlay <= 0)
            plugin.stop();
        if ( !data.isAnimating ) return;

        const progress = ( time - data.animation.lastUpdate ) / data.animation.duration; // ex. 0.01
        const deltaFrames = progress * data.totalImages; // Ex. 0.45 or 1.25

        if ( deltaFrames >= 1) { // Animate only if we need to update 1 frame or more
            // calculate next frame only when we want to render
            // if the getNextFrame check was outside, getNextFrame would be called at screen fps rate, not animation fps
            // if screen fps 144 and animation fps 30, getNextFrame is calling now 30/s instead of 144/s,
            // so after the last frame, raf is repeating until the next frame calculation
            // Between the last frame drawing and new frame time, reverse or loop could be changed, and animation won't stop
            let newFrame = getNextFrame( Math.floor(deltaFrames) );
            if ( data.animation.stopRequested ) { // animation ended from check in getNextFrame()
                plugin.stop();
                data.animation.stopRequested = false;
            } else { // animation on
                data.animation.lastUpdate = time;// time update should be before
                changeFrame(newFrame);
            }
        }
        if ( data.isAnimating ) requestAnimationFrame(animate);
    }

    function getNextFrame(deltaFrames, reverse){
        deltaFrames = deltaFrames%data.totalImages;// handle if deltaFrames > totalImages
        data.animation.deltaFrames = deltaFrames;// it's using in changeFrame to recalculate framesLeftToPlay
        // Handle reverse
        if ( reverse === undefined ) reverse = settings.reverse;
        let newFrameNumber = (reverse) ? data.currentFrame - deltaFrames : data.currentFrame + deltaFrames;

        // Handle loop
        if (settings.loop) { // loop and outside of the frames
            if (newFrameNumber <= 0) {
                // ex. newFrame = -2, total = 50, newFrame = 50 - abs(-2) = 48
                newFrameNumber = data.totalImages - Math.abs(newFrameNumber);
            }
            else if (newFrameNumber > data.totalImages) {
                //ex. newFrame = 53, total 50, newFrame = newFrame - totalFrames = 53 - 50 = 3
                newFrameNumber = newFrameNumber - data.totalImages;
            }
        } else { // no loop and outside of the frames
            if (newFrameNumber <= 0) {
                newFrameNumber = 1;
                data.animation.stopRequested = true;
            }
            else if (newFrameNumber > data.totalImages) {
                newFrameNumber = data.totalImages;
                data.animation.stopRequested = true;
            }
        }

        return  newFrameNumber;
    }

    function animateCanvas(frameNumber){
        clearCanvas(data);
        drawFrame(frameNumber, {settings, data});
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
        data.swipe.threshold = data.canvas.element.width / data.totalImages;
        maybeRedrawFrame({settings, data});
    }
    function maybeRedrawFrame({settings, data}){
        if ( data.isAnyFrameChanged ) { // frames were drawn
            animateCanvas(data.currentFrame);
        } else if ( !data.isAnyFrameChanged && data.poster.imageObject ) { // poster was loaded
            drawFrame(data.poster.imageObject, {settings, data});
        }
        // don't redraw in initial state, or if poster onLoad is not finished yet
    }
    function updateImageSizes(image, force = false){
        if ( !force && (data.canvas.imageWidth || data.canvas.imageHeight) ) return;
        data.canvas.imageWidth = image.naturalWidth;
        data.canvas.imageHeight = image.naturalHeight;
    }

    // Pubic API
    let plugin = {
        /**
         * Start animation
         * @returns {Object} - plugin instance
         */
        play(){
            if ( data.isAnimating ) return;
            if (data.load.isPreloadFinished) {
                data.isAnimating = true;
                // 1st paint, direct call because 1st frame wasn't drawn
                if ( !data.isAnyFrameChanged ) changeFrame(1);
                data.animation.lastUpdate = performance.now();
                requestAnimationFrame(animate);
            } else {
                data.deferredAction = plugin.play;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        /**
         * Stop animation
         * @returns {Object} - plugin instance
         */
        stop(){
            if ( data.isAnimating ){
                node.dispatchEvent( new Event('animate-images:animation-end') );
                if (typeof data.animation.animationPromiseResolve === 'function') data.animation.animationPromiseResolve(this);
            }
            data.isAnimating = false;
            data.animation.framesLeftToPlay = undefined;
            data.animation.animationPromise = null;
            return this;
        },
        /**
         * Toggle between start and stop
         * @returns {Object} - plugin instance
         */
        togglePlay(){
            if ( !data.isAnimating ) plugin.play();
            else plugin.stop();
            return this;
        },
        /**
         * Show next frame
         * @returns {Object} - plugin instance
         */
        next(){
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame( getNextFrame(1) );
            } else {
                data.deferredAction = plugin.next;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        /**
         * Show previous frame
         * @returns {Object} - plugin instance
         */
        prev(){
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame( getNextFrame(1, !settings.reverse) );
            } else {
                data.deferredAction = plugin.prev;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        /**
         * Show a frame with a specified number
         * @param {Number} frameNumber - Number of the frame to show
         * @returns {Object} - plugin instance
         */
        setFrame(frameNumber){
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(frameNumber, data.totalImages));
            } else {
                data.deferredAction = plugin.setFrame.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        /**
         * Starts the animation. which plays until the specified frame number
         * @param {Number} frameNumber - Target frame number
         * @returns {Promise<Object>} - Promise, that resolves after animation end
         */
        playTo(frameNumber){
            if (data.load.isPreloadFinished) {
                frameNumber = normalizeFrameNumber(frameNumber, data.totalImages);

                if (frameNumber > data.currentFrame)   plugin.setReverse(false); // move forward
                else  plugin.setReverse(true); // move backward

                data.animation.animationPromise = plugin.playFrames(Math.abs(frameNumber - data.currentFrame))
            } else {
                data.deferredAction = plugin.playTo.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { settings, data });
            }

            if ( !data.animation.animationPromise ) data.animation.animationPromise =new Promise((resolve, reject)=>{
                data.animation.animationPromiseResolve = resolve;
            });
            return data.animation.animationPromise;
        },
        /**
         * Starts animation in the current direction with the specified number of frames in queue
         * @param {Number} [numberOfFrames=0] - Number of frames to play
         * @returns {Promise<Object>} - Promise, that resolves after animation end
         */
        playFrames(numberOfFrames = 0){
            if (data.load.isPreloadFinished) {
                numberOfFrames = Math.floor(numberOfFrames);
                if (numberOfFrames < 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

                // if this is the 1st animation, we should add 1 frame to the queue to draw the 1st initial frame
                // because 1st frame is not drawn by default
                if (!data.isAnyFrameChanged) numberOfFrames += 1;
                if (numberOfFrames <= 0) return new Promise((resolve)=> { resolve(this)}); //empty animation

                data.animation.framesLeftToPlay = numberOfFrames;
                plugin.play();

            } else {
                data.deferredAction = plugin.playTo.bind(this, numberOfFrames);
                startLoadingImages(data.totalImages, { settings, data });
            }

            if ( !data.animation.animationPromise ) data.animation.animationPromise =new Promise((resolve, reject)=>{
                data.animation.animationPromiseResolve = resolve;
            });
            return data.animation.animationPromise;
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
        preloadImages(number){
            number = number ?? data.totalImages;
            startLoadingImages(number, { settings, data });
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
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(1, data.totalImages));
            } else {
                data.deferredAction = plugin.reset;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        /**
         * Stop animation and clear the canvas. Method doesn't remove canvas element from the DOM
         */
        destroy(){
            plugin.stop();
            clearCanvas();
            removeSwipeEvents( node, swipeHandler, SWIPE_EVENTS );
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
         * @param {String} option - Option name. Allowed options: fps, draggable, loop, reverse, poster, ratio, fillMode
         * @param value - new value
         */
        setOption: (option, value) => {
            const allowedOptions = ['fps', 'draggable', 'loop', 'reverse', 'draggable', 'poster', 'ratio', 'fillMode'];
            if (allowedOptions.includes(option)) {
               settings[option] = value;
               if (option === 'poster') maybeShowPoster({settings, data, drawFrame, updateImageSizes});
               if (option === 'fps') data.animation.duration = calculateFullAnimationDuration(settings);
               if (option === 'ratio') updateCanvasSizes();
               if (option === 'fillMode') updateCanvasSizes();
               if (option === 'draggable') {
                   if (value) setupSwipeEvents(node, swipeHandler, SWIPE_EVENTS);
                   else removeSwipeEvents(node, swipeHandler, SWIPE_EVENTS);
               }
            } else {
                console.warn(`${option} is not allowed in setOption`);
            }
        },
        getCurrentFrame: () => data.currentFrame,
        getTotalImages:() => data.totalImages,
        getRatio: () => data.canvas.ratio,
        isAnimating: () => data.isAnimating,
        isPreloadFinished: () => data.load.isPreloadFinished,
        isLoadedWithErrors: () => data.load.isLoadWithErrors,
        isPosterLoaded: () => data.poster.isPosterLoaded,

    };

    initPlugin();
    return plugin;
}

function addResizeHandler(cb) {
    window.addEventListener("resize", cb); // todo add debouncing
}
function removeResizeHandler(cb) {
    window.removeEventListener("resize", cb);
}

// todo use time instead of performance.now() and test
// todo check dpr
