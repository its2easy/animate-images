export default class DragInput{
    static #SWIPE_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'touchcancel'];

    #data;
    #changeFrame;
    #getNextFrame;
    #boundSwipeHandler;

    #curX;
    #curY;
    #prevX;
    #prevY;
    #isSwiping = false;
    #threshold;
    #pixelsCorrection = 0;

    constructor({ data, changeFrame, getNextFrame }) {
        this.#data = data;
        this.#changeFrame = changeFrame;
        this.#getNextFrame = getNextFrame;
        this.#boundSwipeHandler = this.#swipeHandler.bind(this);
        this.updateThreshold();
    }

    /**
     * Enable rotating by mouse or touch drag
     */
    enableDrag(){
        DragInput.#SWIPE_EVENTS.forEach( (value) => {
            this.#data.canvas.element.addEventListener(value, this.#boundSwipeHandler);
        })
    }

    /**
     * Disable rotating by mouse or touch drag
     */
    disableDrag(){
        DragInput.#SWIPE_EVENTS.forEach( (value) => {
            this.#data.canvas.element.removeEventListener(value, this.#boundSwipeHandler);
        })
        // if disabling while swipeMove is running
        document.removeEventListener('mouseup', this.#boundSwipeHandler);
        document.removeEventListener('mousemove', this.#boundSwipeHandler);
        this.#data.canvas.element.style.cursor = null;
    }

    /**
     * Update one frame threshold in pixels
     * @param newValue
     */
    updateThreshold(newValue = null){
        if (newValue) {
            this.#threshold = newValue;
        }
        else {
            this.#threshold = this.#data.canvas.element.clientWidth / this.#data.totalImages;
        }
    }


    #swipeHandler(event) {
        // get current click/touch point
        let touches;
        if ( event.touches !== undefined && event.touches.length ) touches = event.touches;
        this.#curX = (touches) ? touches[0].pageX : event.clientX;
        this.#curY = (touches) ? touches[0].pageY : event.clientY;

        switch (event.type){
            case 'mousedown': // start
            case 'touchstart':
                if ( event.type === 'touchstart') event.preventDefault();
                document.addEventListener('mouseup', this.#boundSwipeHandler); // move outside of the canvas
                document.addEventListener('mousemove', this.#boundSwipeHandler);
                this.#swipeStart();
                break;
            case 'mousemove':
            case 'touchmove': //move
                if ( event.type === 'touchmove') event.preventDefault();
                if ( this.#isSwiping ) this.#swipeMove();
                break;
            case 'mouseup':
            case 'touchend':
            case 'touchcancel': // end
                if ( event.type === 'touchend' || event.type === 'touchcancel') event.preventDefault();
                document.removeEventListener('mouseup', this.#boundSwipeHandler);
                document.removeEventListener('mousemove', this.#boundSwipeHandler);
                this.#swipeEnd();
                break;
        }
    }
    #swipeStart(){
        if ( !this.#data.pluginApi.isPreloadFinished() ) return;
        this.#data.pluginApi.stop();
        this.#isSwiping = true;
        this.#data.canvas.element.style.cursor = 'grabbing';
        this.#prevX = this.#curX;
        this.#prevY = this.#curY;
        this.#data.canvas.element.dispatchEvent( new CustomEvent('animate-images:drag-start',
            { detail: {frame: this.#data.currentFrame} })
        );
    }
    #swipeMove(){
        const direction = this.#swipeDirection();
        this.#prevY = this.#curY; // Update Y to get right angle

        const swipeLength = Math.round( Math.abs(this.#curX - this.#prevX) ) + this.#pixelsCorrection;
        if ( swipeLength <= this.#threshold) return; // Ignore if less than 1 frame
        if ( direction !== 'left' && direction !== 'right') return; // Ignore vertical directions
        this.#prevX = this.#curX;

        const progress = swipeLength / this.#data.canvas.element.width; // full width swipe means full animation
        let deltaFrames = Math.floor(progress * this.#data.totalImages);
        deltaFrames = deltaFrames % this.#data.totalImages;
        // Add pixels to the next swipeMove if frames equivalent of swipe is not an integer number,
        // e.g one frame is 10px, swipeLength is 13px, we change 1 frame and add 3px to the next swipe,
        // so fullwidth swipe is always rotate sprite for 1 turn
        this.#pixelsCorrection = swipeLength - (this.#threshold * deltaFrames);
        this.#changeFrame(this.#getNextFrame( deltaFrames, (direction === 'left') )); // left means backward (reverse: true)
        this.#data.canvas.element.dispatchEvent( new CustomEvent('animate-images:drag-change',
            { detail: {frame: this.#data.currentFrame} })
        );
    }
    #swipeEnd(){
        //if ( swipeObject.curX === undefined ) return; // there is no x coord on touch end
        this.#curX = this.#curY = this.#prevX = this.#prevY = null;
        this.#isSwiping = false;
        this.#data.canvas.element.style.cursor = null;
        this.#data.canvas.element.dispatchEvent( new CustomEvent('animate-images:drag-end',
            { detail: {frame: this.#data.currentFrame} })
        );
    }
    #swipeDirection(){
        let xDist, yDist, r, swipeAngle;
        xDist = this.#prevX - this.#curX;
        yDist = this.#prevY - this.#curY;
        r = Math.atan2(yDist, xDist);
        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);
        if ( (swipeAngle >= 0 && swipeAngle <= 60) || (swipeAngle <= 360 && swipeAngle >= 300 )) return 'left';
        else if ( swipeAngle >= 120 && swipeAngle <= 240 ) return 'right';
        else if ( swipeAngle >= 241 && swipeAngle <= 299 ) return 'bottom';
        else return 'up';
    }
}
