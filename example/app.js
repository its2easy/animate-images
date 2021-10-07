document.addEventListener("DOMContentLoaded", function() {
    // First example
    let element = document.getElementById('canvas1');
    let imagesArray = Array.from(new Array(90), (v, k) => {
        let number = String(k).padStart(4, "0");
        return `https://distracted-villani-e19534.netlify.app/train/rotation${number}.jpg`;
    });
    let loadingBlock = document.querySelector('.loading1');

    // Initialization
    let instance1 = animateImages(element, {
        images: imagesArray,
        preload: "partial",
        preloadNumber: 20,
        fps: 60,
        poster: imagesArray[0],
        draggable: true,
        loop: true,
        reverse: false,
        autoplay: false,
        fillMode: 'cover',
        //ratio: 2.56,
        onPreloadFinished: (lib) => {
            console.log('Callback: onPreloadFinished');
            //lib.play();
        },
        onPosterLoaded(){
            console.log('Callback: onPosterLoaded');
        }
    });
    instance1.preloadImages();
    setupControls();
    //instance1.play();

    // Events
    element.addEventListener('animate-images:loading-progress', function (e){
        //console.log(`Event: loading progress: ${e.detail.progress}`);
        loadingBlock.querySelector('span').textContent = Math.floor( +e.detail.progress * 100);
    });
    element.addEventListener('animate-images:preload-finished', function (e){
        console.log(`Event: animate-images:preload-finished`);
    });
    element.addEventListener('animate-images:animation-end', function () {
        console.log(`Event: animate-images:animation-end`);
    });
    element.addEventListener('animate-images:poster-loaded', function () {
        console.log(`Event: animate-images:poster-loaded`);
    });
    element.addEventListener('animate-images:loading-error', function () {
        console.log(`Event: animate-images:loading-error`);
    });

    // Controls
    function setupControls(lib){
        console.log('setup controls');
        document.querySelector('.js-play').addEventListener('click', () => {
            instance1.play();
        });
        document.querySelector('.js-stop').addEventListener('click', () => {
            instance1.stop();
        });
        document.querySelector('.js-toggle').addEventListener('click', () => {
            instance1.togglePlay();
        });
        document.querySelector('.js-next').addEventListener('click', () => {
            instance1.next();
        });
        document.querySelector('.js-prev').addEventListener('click', () => {
            instance1.prev();
        });
        document.querySelector('.js-reset').addEventListener('click', () => {
            instance1.reset();
        });
        let reverse = instance1.getOption('reverse');
        let reverseButton = document.querySelector('.js-reverse');
        reverseButton.addEventListener('click', () => {
            reverse = !reverse;
            instance1.setReverse(reverse);
            reverseButton.classList.remove('on', 'off');
            reverseButton.classList.add( (reverse) ? 'on' : 'off' );
        });
        reverseButton.classList.add( (reverse) ? 'on' : 'off' );

        let loop = instance1.getOption('loop');
        let loopButton = document.querySelector('.js-loop');
        loopButton.addEventListener('click', () => {
            loop = !loop;
            instance1.setOption('loop', loop);
            loopButton.classList.remove('on', 'off');
            loopButton.classList.add( (loop) ? 'on' : 'off' );
        });
        loopButton.classList.add( (loop) ? 'on' : 'off' );

        let draggable = instance1.getOption('draggable');
        let draggableButton = document.querySelector('.js-draggable');
        draggableButton.addEventListener('click', () => {
            draggable = !draggable;
            instance1.setOption('draggable', draggable);
            draggableButton.classList.remove('on', 'off');
            draggableButton.classList.add( (draggable) ? 'on' : 'off' );
        });
        draggableButton.classList.add( (draggable) ? 'on' : 'off' );

        let fillMode = instance1.getOption('fillMode');
        let coverBtn = document.querySelector('.js-cover');
        let containBtn = document.querySelector('.js-contain');
        let onBtn = (fillMode === 'cover') ? coverBtn : containBtn;
        onBtn.classList.add('on');
        coverBtn.addEventListener('click', () => {
            changeFillMode('cover');
            containBtn.classList.remove('on');
            coverBtn.classList.add('on');
        });
        containBtn.addEventListener('click', () => {
            changeFillMode('contain');
            coverBtn.classList.remove('on');
            containBtn.classList.add('on');
        });
        function changeFillMode(mode){
            fillMode = mode;
            instance1.setOption('fillMode', mode);
        }

        let framesInput = document.querySelector('.js-frames-input');
        framesInput.setAttribute('max', instance1.getTotalImages());
        framesInput.addEventListener('input', function() {
            instance1.setFrame(this.value);
        });

        // Inputs
        document.querySelector('.js-set-frame').addEventListener('click', function() {
            instance1.setFrame(this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-play-to').addEventListener('click', function() {
            instance1.playTo(this.closest('.js-option-block').querySelector('input').value)
                .then((instance)=> {
                    console.log('play to animation finished');
                });
        });
        document.querySelector('.js-play-frames').addEventListener('click', function() {
            instance1.playFrames(this.closest('.js-option-block').querySelector('input').value)
                .then((instance)=> {
                    console.log('playFrames animation finished');
                });
        });
        document.querySelector('.js-set-fps').addEventListener('click', function() {
            instance1.setOption("fps", this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-set-ratio').addEventListener('click', function() {
            instance1.setOption("ratio", this.closest('.js-option-block').querySelector('input').value);
        });
    }

});

