import { normalizeFrameNumber } from "./utils";

export default class ImagePreloader{
    settings;
    data;
    updateImagesCount;

    isPreloadFinished = false; // onload on all the images
    isFastPreviewPreloadFinished = false; // images from fastPreload mode
    isAnyPreloadFinished = false;

    preloadOffset = 0; // images already in queue
    preloadedImagesNumber = 0; // count of loaded images
    preloadTotalImages;
    isLoadedWithErrors = false;
    tempImagesArray = []; // store images before they are fully loaded
    failedImages = [];
    currentMode = "default"; // "default" or "fast"
    modes = {}

    constructor( {settings, data, updateImagesCount} ) {
        this.settings = settings;
        this.data = data;
        this.updateImagesCount = updateImagesCount;

        // set mode if fast preview
        if (this.settings.fastPreview) {
            this.currentMode = "fast";
            this.data.totalImages = this.settings.fastPreview.images.length;
        }

        this.preloadTotalImages = this.data.totalImages; // get initial value for the first time, update when fast => default mode
        this.modes = {
            default: {
                images: this.settings.images,
                event: "animate-images:preload-finished",
                callback: this.settings.onPreloadFinished,
            },
            fast: {
                images: this.settings?.fastPreview.images,
                event: "animate-images:fast-preview-preload-finished",
                callback: this.settings.onFastPreviewPreloadFinished,
            }
        }
    }

    /**
     * Add number of images to loading queue
     * @param {number} [preloadNumber] - number of images to load
     */
    startLoadingImages(preloadNumber){
        if (this.isPreloadFinished) return;
        if ( !preloadNumber ) preloadNumber = this.preloadTotalImages;
        preloadNumber = Math.round(preloadNumber);

        // if too many, load just the rest
        let unloadedCount = this.preloadTotalImages - this.preloadOffset;
        if (preloadNumber > unloadedCount){
            preloadNumber = unloadedCount;
        }

        // true when all the images are in queue but not loaded yet, (unloadedCount = preloadNumber = 0)
        if (preloadNumber <= 0) return;

        //console.log(`start loop, preloadNumber=${preloadNumber}, offset=${this.preloadOffset}`);
        for (let i = this.preloadOffset; i < (preloadNumber + this.preloadOffset); i++){
            let img = new Image();
            img.onload = img.onerror = this.#onImageLoad.bind(this);
            img.src = this.modes[this.currentMode].images[i]
            this.tempImagesArray[i] = img;
        }
        this.preloadOffset = this.preloadOffset + preloadNumber;
    }

    #onImageLoad(e){
        this.preloadedImagesNumber++;
        let progress = Math.floor((this.preloadedImagesNumber/this.preloadTotalImages) * 1000) / 1000 ;
        this.data.canvas.element.dispatchEvent( new CustomEvent('animate-images:loading-progress', {detail: {progress}}) );
        if (e.type === "error") {
            this.isLoadedWithErrors = true;
            const path = e.path || (e.composedPath && e.composedPath());
            this.failedImages.push(path[0]);
            this.data.canvas.element.dispatchEvent( new Event('animate-images:loading-error') );
        }
        if (this.preloadedImagesNumber >= this.preloadTotalImages) {
            if ( this.isLoadedWithErrors ) this.#clearImagesArray();
            this.#afterPreloadFinishes();
        }
    }

    /**
     * Remove failed images from array
     */
    #clearImagesArray(){
        if ( this.failedImages.length < 1) return;
        this.tempImagesArray = this.tempImagesArray.filter((el) => {
            return !this.failedImages.includes(el);
        });
    }

    #afterPreloadFinishes(){ // check what to do next
        if (this.currentMode === "default"){
            this.isPreloadFinished = true;
        } else {
            this.isFastPreviewPreloadFinished = true;
        }
        this.isAnyPreloadFinished = true; // variable for checks from main plugin
        this.data.loadedImagesArray = [...this.tempImagesArray];
        this.data.totalImages = this.tempImagesArray.length;
        this.updateImagesCount();

        let savedMode = this.currentMode;
        // code below executes only if fastPreview is set
        if ( this.currentMode === "fast" ) { // fast preload has ended
            this.currentMode = "default";
            this.tempImagesArray = [];
            this.preloadOffset = 0;
            this.preloadedImagesNumber = 0;
            this.preloadTotalImages = this.settings.images.length; // update for default preload mode
            // start preload full list if we have action, that started after fast preload end
            if ( this.data.deferredAction ) this.startLoadingImages();
        } else if ( this.currentMode === "default" && this.settings.fastPreview ) { // default preload has ended (only after fast)
            // replace small sequence with full and change frame
            if (this.settings?.fastPreview.fpsAfter) this.data.pluginApi.setOption("fps", this.settings?.fastPreview.fpsAfter)
            let wasAnimating = this.data.pluginApi.isAnimating();
            this.data.pluginApi.setFrame(normalizeFrameNumber(
                (this.settings?.fastPreview.mapFrame ? this.settings.fastPreview.mapFrame(this.data.currentFrame) : 1),
                this.data.totalImages
                ));
            if ( wasAnimating ) this.data.pluginApi.play();
        }

        // actions and callbacks
        if (this.data.deferredAction) this.data.deferredAction();
        this.data.canvas.element.dispatchEvent( new Event(this.modes[savedMode].event) );
        if (this.modes[savedMode].callback) this.modes[savedMode].callback(this.data.pluginApi);

    }

    // Case when fast preload had ended, but we don't have deferred action, because action started with preview frames,
    // this is possible only with preload="all"; or with any preload after plugin.preloadImages() before any action,
    // and we have to start full preload here.
    // This function is called only after frame change was requested.
    maybePreloadAll(){
        if (this.settings.fastPreview && !this.isPreloadFinished) this.startLoadingImages();
    }

}
