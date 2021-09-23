document.addEventListener("DOMContentLoaded", function() {
    // First example
    let element = document.getElementById('canvas1');
    let imagesArray = Array.from(new Array(5), (v, k) => {
        //return `images/motor animation.83.${k + 93}.jpg`;
        return `images/${k + 501}.jpg`;
    });
    let loadingBlock = document.querySelector('.loading1');

    // Initialization
    let instance1 = animateImages.init(element, {
        images: imagesArray,
        preload: "partial",
        preloadNumber: 100,
        fps: 10,
        poster: 'images/motor animation.83.93.jpg',
        //poster: 'images/501.jpg',
        draggable: false, //todo
        loop: true,
        reverse: false,
        autoplay: false,
        onPreloadFinished: (lib) => {
            console.log('Callback: onPreloadFinished');
            setupControls();
        },
        onPosterLoaded(){
            console.log('Callback: onPosterLoaded');
        }
    });

    // Events
    element.addEventListener('animate-images:loading-progress', function (e){
        console.log(`Event: loading progress: ${e.detail.progress}`);
        loadingBlock.querySelector('span').textContent = e.detail.progress * 100;
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
    }

});

