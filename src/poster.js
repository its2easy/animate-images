export class Poster{
    #settings;
    #data;
    #drawFrame;
    #updateImageSizes;

    #imageObject = null;
    #isPosterLoaded = false;

    constructor({settings, data, drawFrame, updateImageSizes}) {
        this.#settings = settings;
        this.#data = data;
        this.#drawFrame = drawFrame;
        this.#updateImageSizes = updateImageSizes;
    }

    loadAndShowPoster(){
        if (this.#settings.poster && !this.#data.isAnyFrameChanged) {
            this.#imageObject = new Image();
            this.#imageObject.onload = this.#imageObject.onerror = this.#onPosterLoaded.bind(this);
            this.#imageObject.src = this.#settings.poster;
        }
    }
    redrawPoster(){
        if ( this.#data.isAnyFrameChanged || !this.#isPosterLoaded ) return;
        this.#drawPoster();
    }

    #onPosterLoaded(e){
        if (e.type === "error") return;
        this.#isPosterLoaded = true;
        this.#data.canvas.element.dispatchEvent( new Event('animate-images:poster-loaded') );
        if ("onPosterLoaded" in this.#settings) this.#settings.onPosterLoaded();
        // show only if there wasn't any frame change from initial
        // if poster loaded after all the images and any action, it won't be shown
        if ( !this.#data.isAnyFrameChanged ) {
            this.#drawPoster();
        }
    }

    #drawPoster(){
        this.#updateImageSizes(this.#imageObject, false);
        this.#drawFrame(this.#imageObject, { settings: this.#settings, data: this.#data });
    }
}
