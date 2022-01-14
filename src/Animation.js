export default class Animation{
    settings;
    data;
    changeFrame;

    lastUpdate; // time from RAF
    duration; // time of the full animation sequence
    stopRequested = false;

    isAnimating = false;
    framesLeftToPlay = undefined; // frames from playTo() and playFrames()
    isFirstRAFCall = true;

    constructor( {settings, data, changeFrame} ) {
        this.settings = settings;
        this.data = data;
        this.changeFrame = changeFrame;
        this.updateDuration();
    }

    play(){
        this.isAnimating = true;
        if ( !this.data.isAnyFrameChanged ) { // 1st paint, direct call because 1st frame wasn't drawn
            this.changeFrame(1);
            // subtract 1 manually, because changeFrame is calling not from animate(), but directly
            this.framesLeftToPlay--;
        }
        //this.updateLastUpdate();
        this.isFirstRAFCall = true;
        requestAnimationFrame(this.#animate.bind(this)); //todo second argument
    }
    stop(){
        if ( this.isAnimating ){
            this.data.canvas.element.dispatchEvent( new Event('animate-images:animation-end') );
            if ( this.settings.onAnimationEnd ) this.settings.onAnimationEnd(this.data.pluginApi);
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
        if ( reverse === undefined ) reverse = this.settings.reverse;

        //let newFrameNumber = (reverse) ? this.data.currentFrame - deltaFrames : this.data.currentFrame + deltaFrames;
        let newFrameNumber = (reverse === this.settings.inversion) // true&&true and false&false mean usual direction (1..last)
            ? this.data.currentFrame + deltaFrames
            : this.data.currentFrame - deltaFrames;

        // Handle loop
        if (this.settings.loop) { // loop and outside of the frames
            if (newFrameNumber <= 0) {
                // ex. newFrame = -2, total = 50, newFrame = 50 - abs(-2) = 48
                newFrameNumber = this.data.totalImages - Math.abs(newFrameNumber);
            }
            else if (newFrameNumber > this.data.totalImages) {
                //ex. newFrame = 53, total 50, newFrame = newFrame - totalFrames = 53 - 50 = 3
                newFrameNumber = newFrameNumber - this.data.totalImages;
            }
        } else { // no loop and outside of the frames
            if (newFrameNumber <= 0) {
                newFrameNumber = 1;
                this.stopRequested = true;
            }
            else if (newFrameNumber > this.data.totalImages) {
                newFrameNumber = this.data.totalImages;
                this.stopRequested = true;
            }
        }

        return  newFrameNumber;
    }

    // works inside RAF
    #animate(time){
        if ( !this.isAnimating ) return;
        // (chrome) 'time' is timestamp from the moment the RAF callback was queued, not timestamp from when it was called,
        // so if there are long task after raf, 'time' will differ from the actual time inside of this callback by the
        // duration of the main thread

        // (firefox) 'time' is timestamp from when raf cb is called, so to prevent jump we have to skip first frame and
        // set 'lastUpdate' = 'time' when first raf cb was called. Skip one possible frame (if fps>=screen fps) is more
        // reliable than compare the difference between 'time' and 'lastUpdate' to the animation duration
        if (this.isFirstRAFCall) {
            this.isFirstRAFCall = false;
            this.lastUpdate = time;
        }

        let deltaFrames = 0;
        // more than 35% of the full duration in 1 raf.
        // duration = 1000ms, main thread long task after play() = 700ms, so without this correction only the last 300ms will be played,
        // which is more correct because exactly 'duration' time will elapse between play() and the last frame, but this will
        // cause the animation looks shorter, to fix that new frame is changed by 1 and 'lastUpdate' will be timestamp after long task,
        // and not 'time' which is timestamp before the long task
        const isLongTaskBeforeRaf = (Math.abs(time - performance.now()) / this.duration) > 0.35;
        if (isLongTaskBeforeRaf) deltaFrames = 1;
        else { // normal execution
            let progress = ( time - this.lastUpdate ) / this.duration; // ex. 0.01
            if (progress < 0) progress = 0; //it happens somehow
            deltaFrames = progress * this.data.totalImages; // Frame change step, Ex. 0.45 or 1.25
        }


        if ( deltaFrames >= 1) { // Animate only if we need to update 1 frame or more
            const newLastUpdate = isLongTaskBeforeRaf ? performance.now() : time;
            // calculate next frame only when we want to render
            // if the getNextFrame check was outside, getNextFrame would be called at screen fps rate, not animation fps
            // if screen fps 144 and animation fps 30, getNextFrame is calling now 30/s instead of 144/s,
            // so after the last frame, raf is repeating until the next frame calculation
            // Between the last frame drawing and new frame time, reverse or loop could be changed, and animation won't stop
            deltaFrames = Math.floor(deltaFrames) % this.data.totalImages;
            if ( deltaFrames > this.framesLeftToPlay ) deltaFrames = this.framesLeftToPlay;// case when screen fps higher than animation fps
            let newFrame = this.getNextFrame( deltaFrames );
            if ( this.stopRequested ) { // animation ended from check in getNextFrame()
                this.data.pluginApi.stop();
                this.stopRequested = false;
            } else { // animation on
                this.lastUpdate = newLastUpdate;
                this.changeFrame(newFrame);
                if (typeof this.framesLeftToPlay !== 'undefined') {
                    this.framesLeftToPlay = this.framesLeftToPlay - deltaFrames;
                    // if 0 frames left, stop immediately, don't wait for the next frame calculation
                    // because if isAnimating become true, this will be a new animation
                    if ( this.framesLeftToPlay <= 0 ) this.data.pluginApi.stop();
                }
            }
        }
        if ( this.isAnimating ) requestAnimationFrame(this.#animate.bind(this));
    }

    /**
     * Set current time as last timestamp
     */
    // updateLastUpdate(){
    //     this.lastUpdate = performance.now();
    // }

    /**
     * Recalculate animation duration after fps or totalImages change
     */
    updateDuration(){
        this.duration =  this.data.totalImages / this.settings.fps  * 1000;
    }
}
