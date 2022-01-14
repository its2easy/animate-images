export default class Animation{
    #settings;
    #data;
    #changeFrame;

    #lastUpdate; // time from RAF
    #duration; // time of the full animation sequence
    #stopRequested = false;

    isAnimating = false;
    framesLeftToPlay = undefined; // frames from playTo() and playFrames()
    animationPromise = null;
    animationPromiseResolve = null;
    isPromiseCreatedBeforeLoad = false; // promise created from deferred action shouldn't be recreated after that action start

    constructor( {settings, data, changeFrame} ) {
        this.#settings = settings;
        this.#data = data;
        this.#changeFrame = changeFrame;
        this.updateDuration();
    }

    play(){
        this.isAnimating = true;
        if ( !this.#data.isAnyFrameChanged ) { // 1st paint, direct call because 1st frame wasn't drawn
            this.#changeFrame(1);
            // subtract 1 manually, because changeFrame is calling not from animate(), but directly
            this.framesLeftToPlay--;
        }
        console.log(this.#lastUpdate);
        this.updateLastUpdate();
        requestAnimationFrame(this.#animate.bind(this));
    }
    stop(){
        if ( this.isAnimating ){
            this.#data.canvas.element.dispatchEvent( new Event('animate-images:animation-end') );
            if (typeof this.animationPromiseResolve === 'function') this.animationPromiseResolve(this.#data.pluginApi);
        }
        this.isAnimating = false;
        this.framesLeftToPlay = undefined;
        this.animationPromise = null;
    }

    /**
     * Get next frame number, based on current state and settings
     * @param {Number} deltaFrames -
     * @param {Boolean} reverse
     * @returns {number|*}
     */
    getNextFrame(deltaFrames, reverse = undefined){
        deltaFrames = Math.floor(deltaFrames); //just to be safe
        // Handle reverse
        if ( reverse === undefined ) reverse = this.#settings.reverse;

        //let newFrameNumber = (reverse) ? this.#data.currentFrame - deltaFrames : this.#data.currentFrame + deltaFrames;
        let newFrameNumber = (reverse === this.#settings.inversion) // true&&true and false&false mean usual direction (1..last)
            ? this.#data.currentFrame + deltaFrames
            : this.#data.currentFrame - deltaFrames;

        // Handle loop
        if (this.#settings.loop) { // loop and outside of the frames
            if (newFrameNumber <= 0) {
                // ex. newFrame = -2, total = 50, newFrame = 50 - abs(-2) = 48
                newFrameNumber = this.#data.totalImages - Math.abs(newFrameNumber);
            }
            else if (newFrameNumber > this.#data.totalImages) {
                //ex. newFrame = 53, total 50, newFrame = newFrame - totalFrames = 53 - 50 = 3
                newFrameNumber = newFrameNumber - this.#data.totalImages;
            }
        } else { // no loop and outside of the frames
            if (newFrameNumber <= 0) {
                newFrameNumber = 1;
                this.#stopRequested = true;
            }
            else if (newFrameNumber > this.#data.totalImages) {
                newFrameNumber = this.#data.totalImages;
                this.#stopRequested = true;
            }
        }

        return  newFrameNumber;
    }

    // works inside RAF
    #animate(time){
        //console.log(time);
        if ( !this.isAnimating ) return;

        const progress = ( time - this.#lastUpdate ) / this.#duration; // ex. 0.01
        let deltaFrames = progress * this.#data.totalImages; // Frame change step, Ex. 0.45 or 1.25

        if ( deltaFrames >= 1) { // Animate only if we need to update 1 frame or more
            // calculate next frame only when we want to render
            // if the getNextFrame check was outside, getNextFrame would be called at screen fps rate, not animation fps
            // if screen fps 144 and animation fps 30, getNextFrame is calling now 30/s instead of 144/s,
            // so after the last frame, raf is repeating until the next frame calculation
            // Between the last frame drawing and new frame time, reverse or loop could be changed, and animation won't stop
            deltaFrames = Math.floor(deltaFrames) % this.#data.totalImages;
            if ( deltaFrames > this.framesLeftToPlay ) deltaFrames = this.framesLeftToPlay;// case when screen fps higher than animation fps
            let newFrame = this.getNextFrame( deltaFrames );
            if ( this.#stopRequested ) { // animation ended from check in getNextFrame()
                this.#data.pluginApi.stop();
                this.#stopRequested = false;
            } else { // animation on
                this.#lastUpdate = time;
                this.#changeFrame(newFrame);
                if (typeof this.framesLeftToPlay !== 'undefined') {
                    this.framesLeftToPlay = this.framesLeftToPlay - deltaFrames;
                    // if 0 frames left, stop immediately, don't wait for the next frame calculation
                    // because if isAnimating become true, this will be a new animation
                    if ( this.framesLeftToPlay <= 0 ) this.#data.pluginApi.stop();
                }
            }
        }
        if ( this.isAnimating ) requestAnimationFrame(this.#animate.bind(this));
    }

    /**
     * Set current time as last timestamp
     */
    updateLastUpdate(){
        this.#lastUpdate = performance.now();
    }

    /**
     * Recalculate animation duration after fps or totalImages change
     */
    updateDuration(){
        this.#duration =  this.#data.totalImages / this.#settings.fps  * 1000;
    }

    // Promises
    setupAnimationPromise(isCalledFromDeferredAction = false){
        if ( !this.animationPromise ) this.animationPromise =new Promise((resolve, reject)=>{
            this.animationPromiseResolve = resolve;
        });
        if (isCalledFromDeferredAction) this.isPromiseCreatedBeforeLoad = true;
    }
    maybeResolveAnimationPromise(){
        if ( this.isPromiseCreatedBeforeLoad ) { // call from deferredAction, dont resolve promise
            this.isPromiseCreatedBeforeLoad = false;
        } else if (typeof this.animationPromiseResolve === 'function') {// normal call, fire previous resolve if exist
            this.animationPromiseResolve(this.#data.pluginApi);
            this.animationPromise = null;
        }
    }

}
