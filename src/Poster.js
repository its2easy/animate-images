import { eventPrefix } from "./settings";

export default class Poster{
    // Internal
    _imageObject;
    _isPosterLoaded;

    constructor({settings, data, drawFrame}) {
        this._settings = settings;
        this._data = data;
        this._drawFrame = drawFrame;

        this._isPosterLoaded = false;
    }

    /**
     * Start loading poster, then  show if needed
     */
    _loadAndShowPoster(){
        if (this._settings.poster && !this._data.isAnyFrameChanged) {
            this._imageObject = new Image();
            this._imageObject.onload = this._imageObject.onerror = this.#onPosterLoaded.bind(this);
            this._imageObject.src = this._settings.poster;
        }
    }

    /**
     * Redraw poster after canvas change if the poster was loaded
     */
    _redrawPoster(){
        if ( this._data.isAnyFrameChanged || !this._isPosterLoaded ) return;
        this.#drawPoster();
    }

    #onPosterLoaded(e){
        if (e.type === "error") return;
        this._isPosterLoaded = true;
        this._data.canvas.element.dispatchEvent( new Event(eventPrefix + 'poster-loaded') );
        this._settings.onPosterLoaded(this._data.pluginApi);
        // show only if there wasn't any frame change from initial
        // if poster loaded after all the images and any action, it won't be shown
        if ( !this._data.isAnyFrameChanged ) {
            this.#drawPoster();
        }
    }

    #drawPoster(){
        this._drawFrame(this._imageObject);
    }
}
