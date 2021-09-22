import { validateInitParameters, getDefaultSettings, normalizeFrameNumber } from "./utils";
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
        lastUpdate: 0,
        duration: options.images.length / settings.fps  * 1000,
        framesLeftToPlay: undefined,
        deltaFrames: 1,
        animationPromise: null,
        animationPromiseResolve: null,
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
            imageWidth: 1600,
            imageHeight: 900,
        }
    }

    function setupCanvas(){
        data.canvas.context = data.canvas.element.getContext("2d");
    }
    function changeFrame(frameNumber){
        console.log(`change frame to ${frameNumber}`);

        if (frameNumber === data.currentFrame) return; //todo 1st frame on init
        animateCanvas(frameNumber);
        if (typeof data.framesLeftToPlay !== 'undefined') {
            data.framesLeftToPlay = data.framesLeftToPlay - data.deltaFrames;
        }
        data.currentFrame = frameNumber;
    }

    // работает внутри raf
    function animate(time){
        if (data.framesLeftToPlay <= 0) plugin.stop();
        const progress = ( time - data.lastUpdate ) / data.duration;
        const deltaFrames = progress * data.totalImages; // Ex. 0.45 or 1.25
        console.log(`animate framesLeftToPlay ${data.framesLeftToPlay}`);

        if ( deltaFrames >= 1) { // Animate only if we need to update 1 frame or more
            changeFrame(getNextFrame( Math.floor(deltaFrames) ));
            data.lastUpdate = performance.now();
        }
        if ( data.isAnimating ) requestAnimationFrame(animate);
    }

    function getNextFrame(deltaFrames, reverse){
        deltaFrames = deltaFrames%data.totalImages;
        data.deltaFrames = deltaFrames;
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
                plugin.stop();
            }
            else if (newFrameNumber > data.totalImages) {
                newFrameNumber = data.totalImages;
                plugin.stop();
            }
        }

        return  newFrameNumber;
    }



    //======= DRAW
    // запускает перерисовку
    function animateCanvas(frameNumber){
        clearCanvas();
        drawFrame(frameNumber);
    }
    function drawFrame(frameNumber){
        console.log(`draw ${frameNumber}`);
        data.canvas.context.drawImage(data.loadedImagesArray[frameNumber-1],
            0,0, data.canvas.imageWidth, data.canvas.imageHeight);
    }
    function clearCanvas(){
        data.canvas.context.clearRect(0, 0, data.canvas.imageWidth, data.canvas.imageHeight);
    }
    //========

    function initPlugin(){
        console.log('init');
        setupCanvas();
        data.lastUpdate = performance.now();
        if (settings.preload === 'all' || settings.preload === "partial"){
            let preloadNumber = (settings.preload === 'all') ? data.totalImages : settings.preloadNumber;
            if (preloadNumber === 0) preloadNumber = data.totalImages;
            startLoadingImages(preloadNumber, { settings, data });
        }
        //console.log('widht ' + data.canvas.element.width);
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
            if ( data.isAnimating ) return;
            if (data.load.isPreloadFinished) {
                data.isAnimating = true;
                data.lastUpdate = performance.now();
                requestAnimationFrame(animate);
            } else {
                console.log('play before preload finish');
                data.deferredAction = plugin.play;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        stop(){
            console.log('stop');
            if ( data.isAnimating ){
                console.log('animation end event');
                node.dispatchEvent( new Event('animate-images:animation-end') );
                if (typeof data.animationPromiseResolve === 'function') data.animationPromiseResolve(this);
            }
            data.isAnimating = false;
            data.framesLeftToPlay = undefined;
            return this;
        },
        togglePlay(){
            console.log('toggled');
            if ( !data.isAnimating ) plugin.play();
            else plugin.stop();
            return this;
        },
        next(){
            console.log('next frame');
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame( getNextFrame(1) );
            } else {
                data.deferredAction = plugin.next;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        prev(){
            console.log('prev frame');
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame( getNextFrame(1, !settings.reverse) );
            } else {
                data.deferredAction = plugin.prev;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        setFrame(frameNumber){
            console.log('set frame ' + frameNumber);

            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(frameNumber, data.totalImages));
            } else {
                data.deferredAction = plugin.setFrame.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },
        playTo(frameNumber){
            console.log('playTo ' + frameNumber);
            if (data.load.isPreloadFinished) {
                frameNumber = normalizeFrameNumber(frameNumber, data.totalImages);
                if (data.currentFrame === frameNumber) return;

                if (frameNumber > data.currentFrame)   plugin.setReverse(false); // move forward
                else  plugin.setReverse(true); // move backward

                plugin.playFrames(Math.abs(frameNumber - data.currentFrame))
            } else {
                data.deferredAction = plugin.playTo.bind(this, frameNumber);
                startLoadingImages(data.totalImages, { settings, data });
            }

            return new Promise((resolve, reject)=>{
                data.animationPromiseResolve = resolve;
            });
        },
        playFrames(numberOfFrames = 0){
            console.log('playFrames ' + numberOfFrames);
            if (data.load.isPreloadFinished) {
                numberOfFrames = Math.floor(numberOfFrames);
                if (numberOfFrames <= 0 ) return; //todo
                data.framesLeftToPlay = numberOfFrames;
                plugin.play();
            } else {
                data.deferredAction = plugin.playTo.bind(this, numberOfFrames);
                startLoadingImages(data.totalImages, { settings, data });
            }

            return new Promise((resolve, reject)=>{
                data.animationPromiseResolve = resolve;
            });
        },
        setReverse(reverse = true){
            settings.reverse = !!reverse;
            return this;
        },
        preloadImages(number){
            number = number ?? data.totalImages;
            startLoadingImages(number, { settings, data });
            return this;
        },
        reset(){
            console.log('reset');
            if (data.load.isPreloadFinished) {
                plugin.stop();
                changeFrame(normalizeFrameNumber(1, data.totalImages));
            } else {
                data.deferredAction = plugin.reset;
                startLoadingImages(data.totalImages, { settings, data });
            }
            return this;
        },

        setOption: (option, value) => {
            const allowedOptions = ['fps', 'draggable', 'loop', 'reverse', 'poster'];
            if (allowedOptions.includes(option)) {
               settings[option] = value;
            } else {
                console.warn(`${option} is not allowed in setOption`);
            }
        },
        getCurrentFrame: () => data.currentFrame,
        getTotalImages:() => data.totalImages,
        isAnimating: () => data.isAnimating,
        isPreloadFinished: () => data.load.isPreloadFinished,
        isLoadWithErrors: () => data.load.isLoadWithErrors,
        destroy(){
            console.log('destroy');
        }
    };

    initPlugin();
    return plugin;
}
