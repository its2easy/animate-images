import { eventPrefix } from "./settings";

export default class DragInput{
    // Public
    _isSwiping = false;

    // Internal
    _curX;
    _curY;
    _prevX;
    _prevY;
    _threshold;
    _pixelsCorrection;
    _lastInteractionTime;

    constructor({ data, settings, changeFrame, getNextFrame }) {
        this._data = data;
        this._settings = settings;
        this._changeFrame = changeFrame;
        this._getNextFrame = getNextFrame;

        this._SWIPE_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'touchcancel'];
        this._isSwiping = false;
        this._boundSwipeHandler = this.#swipeHandler.bind(this);
        this._pixelsCorrection = 0;

        this._updateThreshold();
    }

    /**
     * Enable rotating by mouse or touch drag
     */
    _enableDrag(){
        this._SWIPE_EVENTS.forEach( (value) => {
            this._data.canvas.element.addEventListener(value, this._boundSwipeHandler);
        })
    }

    /**
     * Disable rotating by mouse or touch drag
     */
    _disableDrag(){
        this._SWIPE_EVENTS.forEach( (value) => {
            this._data.canvas.element.removeEventListener(value, this._boundSwipeHandler);
        })
        // if disabling while swipeMove is running
        document.removeEventListener('mouseup', this._boundSwipeHandler);
        document.removeEventListener('mousemove', this._boundSwipeHandler);
        this._data.canvas.element.style.cursor = null;
    }

    /**
     * Update one frame threshold in pixels
     * @param newValue
     */
    _updateThreshold(newValue = null){
        if (newValue) {
            this._threshold = newValue;
        }
        else {
            this._threshold = this._data.canvas.element.clientWidth / this._data.totalImages;
        }
    }


    #swipeHandler(event) {
        // get current click/touch point
        let touches;
        if ( event.touches !== undefined && event.touches.length ) touches = event.touches;
        this._curX = (touches) ? touches[0].pageX : event.clientX;
        this._curY = (touches) ? touches[0].pageY : event.clientY;

        switch (event.type){
            case 'mousedown': // start
            case 'touchstart':
                if ( event.type === 'touchstart' && event.cancelable ) {
                    //event.preventDefault();
                    this.#maybeDisableScroll(event);
                }
                document.addEventListener('mouseup', this._boundSwipeHandler); // move outside of the canvas
                document.addEventListener('mousemove', this._boundSwipeHandler);
                this.#swipeStart();
                break;
            case 'mousemove':
            case 'touchmove': //move
                if ( this._isSwiping ) {
                    //if ( event.type === 'touchmove' && event.cancelable) event.preventDefault();
                    this.#swipeMove();
                }
                break;
            case 'mouseup':
            case 'touchend':
            case 'touchcancel': // end
                //if ( (event.type === 'touchend' || event.type === 'touchcancel') && event.cancelable) event.preventDefault();
                if ( this._isSwiping ) {
                    document.removeEventListener('mouseup', this._boundSwipeHandler);
                    document.removeEventListener('mousemove', this._boundSwipeHandler);
                    this.#swipeEnd();
                }
                break;
        }
    }
    #swipeStart(){
        const plugin = this._data.pluginApi;
        if ( !(plugin.isFastPreloadFinished() || plugin.isPreloadFinished()) ) return;
        // trigger full load after user interaction after fast preload finished
        if (this._settings.fastPreview && !plugin.isPreloadFinished() && plugin.isFastPreloadFinished()) {
            plugin.preloadImages();
        }
        plugin.stop();
        this._isSwiping = true;
        this._data.canvas.element.style.cursor = 'grabbing';
        this._prevX = this._curX;
        this._prevY = this._curY;
        this._data.canvas.element.dispatchEvent( new CustomEvent(eventPrefix + 'drag-start',
            { detail: {frame: this._data.currentFrame} })
        );
    }
    #swipeMove(){
        const direction = this.#swipeDirection();
        const swipeLength = Math.round( Math.abs(this._curX - this._prevX) * this._settings.dragModifier ) + this._pixelsCorrection;

        if ( swipeLength <= this._threshold) return;// Ignore if less than 1 frame
        if ( direction !== 'left' && direction !== 'right') return; // Ignore vertical directions

        this._prevX = this._curX;
        this._prevY = this._curY; // Update Y to get right angle

        const progress = swipeLength / this._data.canvas.element.width; // full width swipe means full animation
        let deltaFrames = Math.floor(progress * this._data.totalImages);
        deltaFrames = deltaFrames % this._data.totalImages;
        // Add pixels to the next swipeMove if frames equivalent of swipe is not an integer number,
        // e.g one frame is 10px, swipeLength is 13px, we change 1 frame and add 3px to the next swipe,
        // so fullwidth swipe is always rotate sprite for 1 turn (with 'dragModifier' = 1)
        this._pixelsCorrection = swipeLength - (this._threshold * deltaFrames);
        let isReverse = (direction === 'left'); // left means backward (reverse: true)
        if (this._settings.inversion) isReverse = !isReverse;// invert direction
        this._changeFrame(this._getNextFrame( deltaFrames, isReverse )); // left means backward (reverse: true)
        this._data.canvas.element.dispatchEvent( new CustomEvent(eventPrefix + 'drag-change',
            { detail: {frame: this._data.currentFrame} })
        );
    }
    #swipeEnd(){
        //if ( swipeObject.curX === undefined ) return; // there is no x coord on touch end
        this._curX = this._curY = this._prevX = this._prevY = null;
        this._isSwiping = false;
        this._data.canvas.element.style.cursor = null;
        this._lastInteractionTime = new Date().getTime();
        this._data.canvas.element.dispatchEvent( new CustomEvent(eventPrefix + 'drag-end',
            { detail: {frame: this._data.currentFrame} })
        );
    }
    #swipeDirection(){
        let xDist, yDist, r, swipeAngle;
        xDist = this._prevX - this._curX;
        yDist = this._prevY - this._curY;
        r = Math.atan2(yDist, xDist);
        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);

        if ( (swipeAngle >= 0 && swipeAngle <= 60) || (swipeAngle <= 360 && swipeAngle >= 300 )) return 'left';
        else if ( swipeAngle >= 120 && swipeAngle <= 240 ) return 'right';
        else if ( swipeAngle >= 241 && swipeAngle <= 299 ) return 'bottom';
        else return 'up';
    }

    /**
     * Idea from https://github.com/giniedp/spritespin/blob/master/src/plugins/input-drag.ts#L45
     * @param {Event} event
     */
    #maybeDisableScroll(event){
        // always prevent
        if (this._settings.touchScrollMode === "preventPageScroll") event.preventDefault();
        // check timer
        if (this._settings.touchScrollMode === "pageScrollTimer") {
            const now = new Date().getTime();
            // less time than delay => prevent page scroll
            if (this._lastInteractionTime && (now - this._lastInteractionTime < this._settings.pageScrollTimerDelay) ){
                event.preventDefault();
            } else { // more time than delay or first interaction => clear timer
                this._lastInteractionTime = null;
            }
        }
        // if touchScrollMode="allowPageScroll" => don't prevent scroll
    }
}
