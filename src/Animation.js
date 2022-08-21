import { eventPrefix } from "./settings";

export default class Animation{
    // Public
    _isAnimating;
    _framesLeftToPlay; // frames from playTo() and playFrames()

    // Internal
    _lastUpdate; // time from RAF
    _duration; // time of the full animation sequence
    _stopRequested;
    _framesQueue; // save decimal part if deltaFrames is not round, to prevent rounding errors
    _progressThreshold; // >35% mea`ns that there was a long task in callstack

    constructor( {settings, data, changeFrame} ) {
        this._settings = settings;
        this._data = data;
        this._changeFrame = changeFrame;

        this._stopRequested = false;
        this._isAnimating = false;
        this._framesQueue = 0;
        this._progressThreshold = 0.35;

        this._updateDuration();
    }

    _play(){
        this._isAnimating = true;
         this._stopRequested = false; // fix for the case when stopRequested was set inside getNextFrame that was called outside #animate
        if ( !this._data.isAnyFrameChanged ) { // 1st paint, direct call because 1st frame wasn't drawn
            this._changeFrame(1);
            // subtract 1 manually, because changeFrame is calling not from animate(), but directly
            if ( Number.isFinite(this._framesLeftToPlay) ) this._framesLeftToPlay--; // undefined-- = NaN
        }

         this._lastUpdate = null;// first 'lastUpdate' should be always set in the first raf of the current animation
        requestAnimationFrame(this.#animate.bind(this));
    }
    _stop(){
        const wasAnimating = this._isAnimating;
        this._isAnimating = false;
        this._framesLeftToPlay = undefined;
        if ( wasAnimating ){ // !!! callbacks and events should be called after all the values are reset
            this._data.canvas.element.dispatchEvent( new Event(eventPrefix + 'animation-end') );
            this._settings.onAnimationEnd(this._data.pluginApi);
        }
    }

    /**
     * Get next frame number, based on current state and settings
     * @param {Number} deltaFrames -
     * @param {Boolean} reverse
     * @returns {number|*}
     */
    _getNextFrame(deltaFrames, reverse = undefined){
        deltaFrames = Math.floor(deltaFrames); //just to be safe
        // Handle reverse
        if ( reverse === undefined ) reverse = this._settings.reverse;
        let newFrameNumber = reverse ? this._data.currentFrame - deltaFrames : this._data.currentFrame + deltaFrames

        // Handle loop
        if (this._settings.loop) { // loop and outside of the frames
            if (newFrameNumber <= 0) {
                // for example newFrame = -2, total = 50, newFrame = 50 - abs(-2) = 48
                newFrameNumber = this._data.totalImages - Math.abs(newFrameNumber);
            }
            else if (newFrameNumber > this._data.totalImages) {
                // for example newFrame = 53, total 50, newFrame = newFrame - totalFrames = 53 - 50 = 3
                newFrameNumber = newFrameNumber - this._data.totalImages;
            }
        } else { // no loop and outside of the frames
            if (newFrameNumber <= 0) {
                newFrameNumber = 1;
                this._stopRequested = true;
            }
            else if (newFrameNumber > this._data.totalImages) {
                newFrameNumber = this._data.totalImages;
                 this._stopRequested = true;
            }
        }
        return  newFrameNumber;
    }

    // RAF callback
    // (chrome) 'timestamp' is timestamp from the moment the RAF callback was queued
    // (firefox) 'timestamp' is timestamp from the moment the RAF callback was called
    // the difference is equal to the time that the main thread was executing after raf callback was queued
    #animate(timestamp){
        if ( !this._isAnimating ) return;

        // lastUpdate is setting here because the time between play() and #animate() is unpredictable, and
        // lastUpdate = performance.now instead of timestamp because timestamp is unpredictable and depends on the browser.
        // Possible frame change in the first raf will always be skipped, because time <= performance.now
        if ( ! this._lastUpdate)  this._lastUpdate = performance.now();

        let deltaFrames;
        // Check if there was a long task between this and the last frame, if so move 1 fixed frame and change lastUpdate to now
        // to prevent animation jump. (1,2,3,long task,75,76,77, ... => 1,2,3,long task,4,5,6,...)
        // In this case the duration will be longer
        let isLongTaskBeforeRaf = (Math.abs(timestamp - performance.now()) /  this._duration) >  this._progressThreshold; //chrome check
        let progress = ( timestamp -  this._lastUpdate ) /  this._duration; // e.g. 0.01
        if ( progress >  this._progressThreshold ) isLongTaskBeforeRaf = true; // firefox check

        if (isLongTaskBeforeRaf) deltaFrames = 1; // raf after long task, just move to the next frame
        else { // normal execution, calculate progress after the last frame change
            if (progress < 0) progress = 0; //it happens sometimes, when raf timestamp is from the past for some reason
            deltaFrames = progress * this._data.totalImages; // Frame change step, e.g. 0.45 or 1.25
            // e.g. progress is 0.8 frames, queue is 0.25 frames, so now deltaFrames is 1.05 frames and we need to update canvas,
            // without this raf intervals will cause cumulative rounding errors, and actual fps will decrease
            deltaFrames = deltaFrames +  this._framesQueue;
        }

        // calculate next frame only when we want to render
        // if the getNextFrame check was outside, getNextFrame would be called at screen fps rate, not animation fps
        // if screen fps 144 and animation fps 30, getNextFrame is calling now 30/s instead of 144/s.
        // After the last frame, raf is repeating until the next frame calculation,
        // between the last frame drawing and new frame time, reverse or loop could be changed, and animation won't stop
        if ( deltaFrames >= 1) { // Calculate only if we need to update 1 frame or more
            const newLastUpdate = isLongTaskBeforeRaf ? performance.now() : timestamp;

            this._framesQueue = deltaFrames % 1; // save decimal part for the next RAFs
            deltaFrames = Math.floor(deltaFrames) % this._data.totalImages;
            if ( deltaFrames > this._framesLeftToPlay ) deltaFrames = this._framesLeftToPlay;// case when  animation fps > device fps
            const newFrame = this._getNextFrame( deltaFrames );
            if ( this._stopRequested ) { // animation ended from check in getNextFrame()
                this._data.pluginApi.stop();
                this._stopRequested = false;
                if (this._data.pluginApi.getCurrentFrame() !== newFrame ) this._changeFrame(newFrame); //last frame fix if fps > device fps
            } else { // animation is on
                this._lastUpdate = newLastUpdate;
                this._changeFrame(newFrame);
                if (typeof this._framesLeftToPlay !== 'undefined') {
                    this._framesLeftToPlay = this._framesLeftToPlay - deltaFrames;
                    // if 0 frames left, stop immediately, don't wait for the next frame calculation
                    // because if isAnimating become true, this will be a new animation
                    if ( this._framesLeftToPlay <= 0 ) this._data.pluginApi.stop();
                }
            }
        }
        if ( this._isAnimating ) requestAnimationFrame(this.#animate.bind(this));
    }

    /**
     * Recalculate animation duration after fps or totalImages change
     */
    _updateDuration(){
         this._duration =  this._data.totalImages / this._settings.fps  * 1000;
    }
}
