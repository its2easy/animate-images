import { eventPrefix } from "./settings";

export default class ImagePreloader{

    constructor( {settings, data, updateImagesCount} ) {
        this._settings = settings;
        this._data = data;
        this._updateImagesCount = updateImagesCount;

        // Public
        this._isPreloadFinished = false;// onload on all the images
        this._isFastPreloadFinished = false;// images from fastPreload mode
        this._isAnyPreloadFinished = false;
        this._isLoadedWithErrors = false;

        // Internal
        this._preloadOffset = 0;// images already in queue
        this._preloadedCount = 0;// count of loaded images
        this._tempImagesArray = []; // store images before they are fully loaded
        this._failedImages = [];
        this._currentMode = "default";// "default" or "fast"
        this._modes = {
            default: {
                images: this._settings.images,
                event: eventPrefix + "preload-finished",
                callback: this._settings.onPreloadFinished,
            },
            fast: {
                images: this._settings?.fastPreview.images,
                event: eventPrefix + "fast-preload-finished",
                callback: this._settings.onFastPreloadFinished,
            }
        }

        // set mode if fast preview
        if (this._settings.fastPreview) {
            this._currentMode = "fast";
            this._data.totalImages = this._settings.fastPreview.images.length;
        }
        this._totalImages = this._data.totalImages; // get initial value for the first time, update when fast => default mode
    }

    /**
     * Add number of images to loading queue
     * @param {number} [preloadNumber] - number of images to load
     */
    _startLoading(preloadNumber){
        if (this._isPreloadFinished) return;
        if ( !preloadNumber ) preloadNumber = this._totalImages;
        preloadNumber = Math.round(preloadNumber);

        // if too many, load just the rest
        const unloadedCount = this._totalImages - this._preloadOffset;
        if (preloadNumber > unloadedCount){
            preloadNumber = unloadedCount;
        }

        // true when all the images are in queue but not loaded yet, (unloadedCount = preloadNumber = 0)
        if (preloadNumber <= 0) return;

        //console.log(`start loop, preloadNumber=${preloadNumber}, offset=${this._preloadOffset}`);
        for (let i = this._preloadOffset; i < (preloadNumber + this._preloadOffset); i++){
            let img = new Image();
            img.onload = img.onerror = this.#onImageLoad.bind(this);
            img.src = this._modes[this._currentMode].images[i]
            this._tempImagesArray[i] = img;
        }
        this._preloadOffset = this._preloadOffset + preloadNumber;
    }

    #onImageLoad(e){
        this._preloadedCount++;
        const progress = Math.floor((this._preloadedCount/this._totalImages) * 1000) / 1000 ;
        this._data.canvas.element.dispatchEvent( new CustomEvent(eventPrefix + 'loading-progress', {detail: {progress}}) );
        if (e.type === "error") {
            this._isLoadedWithErrors = true;
            const path = e.path || (e.composedPath && e.composedPath());
            this._failedImages.push(path[0]);
            this._data.canvas.element.dispatchEvent( new Event(eventPrefix + 'loading-error') );
        }
        if (this._preloadedCount >= this._totalImages) {
            if ( this._isLoadedWithErrors ) this.#clearImagesArray();
            this.#afterPreloadFinishes();
        }
    }

    /**
     * Remove failed images from array
     */
    #clearImagesArray(){
        if ( this._failedImages.length < 1) return;
        this._tempImagesArray = this._tempImagesArray.filter((el) => {
            return !this._failedImages.includes(el);
        });
    }

    #afterPreloadFinishes(){ // check what to do next
        if (this._currentMode === "default"){
            this._isPreloadFinished = true;
        } else {
            this._isFastPreloadFinished = true;
        }
        this._isAnyPreloadFinished = true; // variable for checks from main plugin
        this._data.loadedImagesArray = [...this._tempImagesArray];
        this._data.totalImages = this._tempImagesArray.length;
        this._updateImagesCount();

        const savedMode = this._currentMode;
        const plugin = this._data.pluginApi;
        // code below executes only if fastPreview is set
        if ( this._currentMode === "fast" ) { // fast preload has ended
            this._currentMode = "default";
            this._tempImagesArray = [];
            this._preloadOffset = this._preloadedCount = 0;
            this._totalImages = this._settings.images.length; // update for default preload mode
            // start preload full list if we have action, that started after fast preload end
            if ( this._data.deferredAction ) this._startLoading();
        } else if ( this._currentMode === "default" && this._settings.fastPreview ) { // default preload has ended (only after fast)
            // replace small sequence with full and change frame
            if (this._settings?.fastPreview.fpsAfter) plugin.setOption("fps", this._settings?.fastPreview.fpsAfter)
            const wasAnimating = plugin.isAnimating();
            const matchFrame = this._settings?.fastPreview.matchFrame;
            plugin.setFrame( matchFrame ? matchFrame(this._data.currentFrame) : 1 );
            if ( wasAnimating ) plugin.play();
        }

        // actions and callbacks
        if (this._data.deferredAction) this._data.deferredAction();
        this._data.canvas.element.dispatchEvent( new Event(this._modes[savedMode].event) );
        this._modes[savedMode].callback(plugin);

    }

    // Case when fast preload had ended, but we don't have deferred action, because action started with preview frames,
    // this is possible only with preload="all"; or with any preload after plugin.preloadImages() before any action,
    // and we have to start full preload here.
    // This function is called only after frame change was requested.
    _maybePreloadAll(){
        if (this._settings.fastPreview && !this._isPreloadFinished) this._startLoading();
    }

}
