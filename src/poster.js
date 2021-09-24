export function maybeShowPoster({settings, data, drawFrame}){
    if (settings.poster && !data.isAnyFrameChanged) {
        console.log('start preloading poster');
        let img = new Image();
        img.onload = onPosterLoad;
        img.onerror = onPosterLoad;
        img.src = settings.poster;
        function onPosterLoad(e){
            if (e.type === "error") return;
            console.log('poster loaded');
            data.poster.isPosterLoaded = true;
            data.poster.imageObject = img;
            data.canvas.element.dispatchEvent( new Event('animate-images:poster-loaded') );
            if ("onPosterLoaded" in settings) settings.onPosterLoaded();
            // show only if there wasn't any frame change from initial
            // if poster loaded after all the images and any action, it won't be shown
            if ( !data.isAnyFrameChanged ) {
                console.log('poster shown');
                drawFrame(img, {settings, data});
            }
        }
    }
}
