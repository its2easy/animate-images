export default class ImagePreloader{
    #settings;
    #data;
    #afterPreloadFinishesCallback;
    #updateImagesCount;

    #isPreloadFinished = false; // onload on all the images
    #preloadOffset = 0; // images already in queue
    #preloadedImagesNumber = 0; // count of loaded images
    #isLoadedWithErrors = false;
    #failedImages = [];

    constructor( {settings, data, afterPreloadFinishes, updateImagesCount} ) {
        this.#settings = settings;
        this.#data = data;
        this.#afterPreloadFinishesCallback = afterPreloadFinishes;
        this.#updateImagesCount = updateImagesCount;
    }

    /**
     * Add number of images to loading queue
     * @param {Number }preloadNumber=0 - number of images to load
     */
    startLoadingImages(preloadNumber = 0){
        if (this.#isPreloadFinished) return;

        // if too many, load just the rest
        let unloadedCount = this.#data.totalImages - this.#preloadOffset;
        if (preloadNumber > unloadedCount){
            preloadNumber = unloadedCount;
        }

        // true when all the images are in queue but not loaded yet, (unloadedCount = preloadNumber = 0)
        if (preloadNumber <= 0) return;

        //console.log(`start loop, preloadNumber=${preloadNumber}, offset=${this.#preloadOffset}`);
        for (let i = this.#preloadOffset; i < (preloadNumber + this.#preloadOffset); i++){
            let img = new Image();
            img.onload = img.onerror = this.#onImageLoad.bind(this);
            img.src = this.#settings.images[i];
            this.#data.loadedImagesArray[i] = img;
        }
        this.#preloadOffset = this.#preloadOffset + preloadNumber;
    }

    isPreloadFinished(){
        return this.#isPreloadFinished;
    }
    isLoadedWithErrors(){
        return this.#isLoadedWithErrors;
    }

    #onImageLoad(e){
        this.#preloadedImagesNumber++;
        let progress = Math.floor((this.#preloadedImagesNumber/this.#data.totalImages) * 1000) / 1000 ;
        this.#data.canvas.element.dispatchEvent( new CustomEvent('animate-images:loading-progress', {detail: {progress}}) );
        if (e.type === "error") {
            this.#isLoadedWithErrors = true;
            this.#failedImages.push(e.path[0]);
            this.#data.canvas.element.dispatchEvent( new Event('animate-images:loading-error') );
        }
        if (this.#preloadedImagesNumber >= this.#data.totalImages) {
            if ( this.#isLoadedWithErrors ) this.#clearImagesArray();
            this.#isPreloadFinished = true;
            this.#afterPreloadFinishesCallback();
        }
    }

    /**
     * Remove failed images and update data
     */
    #clearImagesArray(){
        if ( this.#failedImages.length < 1) return;
        console.log('clearImagesArray');
        this.#data.loadedImagesArray = this.#data.loadedImagesArray.filter((el) => {
            return !this.#failedImages.includes(el);
        });
        this.#data.totalImages = this.#data.loadedImagesArray.length;
        this.#updateImagesCount();
    }
}
