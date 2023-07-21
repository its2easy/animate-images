<h1 align="center">
   AnimateImages
</h1>

![npm](https://img.shields.io/npm/v/@its2easy/animate-images)

Demo - [codepen](https://codepen.io/its2easy/pen/powQJmd)

**AnimateImages** is a lightweight library (17kb) that animates a sequence of images 
to use in animations or pseudo 3d product view. It works WITHOUT BUILT-IN UI and mainly 
developed for complex animations.

To use it, you have to get a series of frames from a video or 3d app.
The frames must be separated images of the same size.

* [Installation](#installation)
* [Usage](#usage)
* [Sizes and responsive behavior](#responsive)
* [Options](#options)
* [Methods](#methods)
* [Events](#events)
* [Browser support](#browser_support)
* [License](#license)

## <a name="installation"></a>Installation
### Browser script tag
Add with CDN link:
```html
<script src="https://cdn.jsdelivr.net/npm/@its2easy/animate-images"></script>
```
Or download <a href="https://unpkg.com/@its2easy/animate-images">minified version</a>
 and include in html:
```html
<script src="animate-images.umd.min.js"></script>
```
```javascript
let instance = new AnimateImages(element, options);
```
### npm
```
npm i @its2easy/animate-images --save
```
```javascript
import AnimateImages from "@its2easy/animate-images";
let instance = new AnimateImages(element, options);
```

<details>
<summary>It is possible to directly import untranspiled esm version:</summary>

This version has not been processed by babel:
```javascript
import AnimateImages from '@its2easy/animate-images/build/untranspiled/animate-images.esm.min.js'; //or animate-images.esm.js
```
> :warning: You should probably add it to your build process if you use untranspiled version. Example for webpack:
```javascript
rules: [
    {
        test: /\.js$/,
        exclude: /node_modules(?!(\/|\\)@its2easy(\/|\\)animate-images(\/|\\)build)/,
        use: {
            loader: 'babel-loader',
        }
    }
]
```
or
```javascript
rules: [
    {
        // basic js rule
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
        }
    },
    {
        // additional rule
        test: /\.js$/,
        include: /node_modules(\/|\\)@its2easy(\/|\\)animate-images(\/|\\)build/,
        use: {
            loader: 'babel-loader',
        }
    },
]
```

</details>

<details>
<summary>All available versions:</summary>

umd build:

`@its2easy/animate-images/build/animate-images.umd.min.js` - default for browser script tag and legacy bundlers

esm builds processed whit babel:

`@its2easy/animate-images/build/animate-images.esm.min.js` - default for webpack and module environments

`@its2easy/animate-images/build/animate-images.esm.js`

esm builds without babel transformation:

`@its2easy/animate-images/build/untranspiled/animate-images.esm.min.js`

`@its2easy/animate-images/build/untranspiled/animate-images.esm.js`

:information_source: If you are using **webpack 4** and babel with modern target browsers,
then you might get an error while importing, because webpack 4 doesn't support some modern js
syntax and babel doesn't transpile it because browsers support for this syntax is high enough now.
Use **webpack 5** to fix it.
</details>   


## <a name="usage"></a>Usage
Create canvas element 
```html
 <canvas class="canvas_el" width="800" height="500"></canvas>
```

Initialize with options
```javascript
let element = document.querySelector('canvas.canvas-el');
let imagesArray = Array.from(new Array(90), (v, k) => { // generate array of urls
    let number = String(k).padStart(4, "0");
    return `path/to/your/images/frame-${number}.jpg`;
});
let instance = new AnimateImages(element, {
    images: imagesArray, /* required */
    preload: "partial",
    preloadNumber: 20,
    loop: true,
    fps: 60,
    poster: 'path/to/poster/image.jpg',
});
instance.play();
```

Methods called from `onPreloadFinished` callback will start immediately, but you have to use `options.preload: 'all'`
or call `plugin.preload()`. The plugin loads each image only once, so it's safe to call `preload` multiple times, 
even after the load has been completed. If `autoplay: true`, full preload will start immediately.
```javascript
let instance = new AnimateImages(element, {
    images: imagesArray, /* required */
    preload: "none", // if 'all', you don't need to call preload()
    onPreloadFinished: function (plugin){
        plugin.play();
    }
});
instance.preload(30);//load the first part

setTimeout(() => {
    instance.preload(60);// laod the rest
}, 1000);
// or instance.preload() to load all the images
```
Methods that were called from outside of `onPreloadFinished` will trigger the load of all remaining images, 
wait for the full load, and then execute the action. If multiple methods have been called before 
load, only the last will be executed
```javascript
let instance = animateImages.init(element,
    {
        images: imagesArray,
        preload: "none", 
    }
);
// if preload: "none", it will trigger the load, and play after all the image loaded
// if preload: "all", it will wait until full load and then start
instance.play(); 
```
In general, the plugin will load all the frames before any action, but you can preload a part of the 
images in some cases, for example, when the user is scrolling to the section in which the animation will 
take place.

### Loading errors
All images that have been loaded with errors will be removed from the array of frames. Duration
of the animation will be recalculated.

New frames count could be obtained in preload callback:
```javascript
new AnimateImages(element, {
    ...
    onPreloadFinished: function (instance){
        if ( instance.isLoadedWithErrors() ) {
            let newFramesCount = instance.getTotalImages();
        }
    },
});
```

## <a name="responsive"></a>Sizes and responsive behavior
**TL;DR**
use your image dimensions as width and height canvas properties, add ```width: 100%``` to canvas, 
add more css if you need:
```html
<canvas width="1600" height="768" style="width: 100%"></canvas>
```

---

Size calculation is controlled by ```responsiveAspect```. Default is ```width``` which means that canvas **width** 
should be defined or restricted by CSS, and **height** will be calculated by the plugin. With ```responsiveAspect: "height"``` 
you should control **height** and leave **width** auto.

Canvas itself should have ```width: 100%``` (```height: 100%``` if responsiveAspect is "height"). Size restrictions 
could be set on canvas or on wrapper element:
```html
<canvas width="800" height="500" style="width: 100%; max-width: 1000px"></canvas>
```
<details>
<summary>responsive height example</summary>

```html
<div class="wrapper" style="height: 100%;">
    <canvas width="800" height="500" style="height: 100%; max-height: 400px"></canvas>
</div>
```

</details>

:information_source: Secondary side of the canvas should be ```auto``` and not fixed by CSS. If it's fixed, 
the ratio can't be used, and the canvas will use its natural CSS size.

#### Ratio
To calculate secondary side, plugin uses ratio of
inline width and height canvas properties `<canvas width="1600" height="900">` (if they're not set, default
 is 300x150). This ratio can be overwritten by `options.ratio`.  

#### Fill mode
If **the canvas and images have the same ratio**, the full image will be displayed. If **the ratios are the same, 
but sizes are different**, the image will be scaled to fit the canvas. The dimensions of the images are taken from the 
image itself after load, and they do not need to be set anywhere in the settings.On the page the canvas 
with the image will be scaled to canvas CSS size. 

If **canvas and image ratios are different**, then image will use `options.fillMode`, which works like 
background-size `cover` and `contain`, and the image will be centered.

To display the full image, check the image width and height, and set it as canvas inline `width` and `height` 
(or set `options.ratio`).
Then set canvas width by CSS (width="500px" or width="100%" or max-width="800px" etc), and don't set 
canvas height (with default responsiveAspect). 

#### Other
For example, &lt;canvas width="800" height="400"&gt;, image 1200x600, canvas has css max-width="500px". 
Image will be scaled to 800x400 inside canvas and fully visible, canvas on the page will be displayed 
500px x 250px.

After page resize, the sizes will be recalculated automatically, but if canvas was resized **by a script**, call 
`instance.updateCanvas()`


## <a name="options"></a>Options

```javascript
new AnimateImages(element, options);
```
element : HTMLCanvasElement - canvas DOM element (required) 

options:

| Parameter | Type | Default | Description |
| :--- | :---: | :---:| :---  |
| **images** | Array&lt;string&gt; | | **(Required)** Array with images URLs |
| **preload** | string | 'all' | Preload mode ("`all`", "`none`", "`partial`") |
| **preloadNumber** | number | 0 | Number of images to preload when `preload: "partial"` (0 for all images) |
| **poster** | string | | URL of the poster image, works like poster in ```<video>``` |
| **fps** | number | 30 | FPS when playing. Determines the duration of the animation (e.g. 90 images and 60 fps = 1.5s, 90 images and 30fps = 3s) |
| **loop** | boolean | false | Loop the animation | 
| **autoplay** | boolean | false | Autoplay |
| **reverse** | boolean | false | Reverse direction |
| **ratio** | number | false | Canvas width/height ratio, it has higher priority than inline canvas width and height |
| **fillMode** | string | 'cover' | Fill mode to use **if canvas and image aspect ratios are different** ("`cover`" or "`contain`") |
| **draggable** | boolean | false | Draggable by mouse or touch |
| **inversion** | boolean | false | Inversion changes drag direction. Use it if animation direction doesn't match swipe direction  |
| **dragModifier** | number | 1 | Sensitivity factor for user interaction. Only positive numbers are allowed |
| **touchScrollMode** | string | 'pageScrollTimer' | Page scroll behavior with touch events _(only for events that fire in the plugin area)_. Available modes: `preventPageScroll` - touch scroll is always disabled. `allowPageScroll` - touch scroll is always enabled. `pageScrollTimer` - after the first interaction the scroll is not disabled; if the time between the end of the previous interaction and the start of a new one is less than _pageScrollTimerDelay_, then scroll will be disabled; if more time has passed, then scroll will be enabled again |
| **pageScrollTimerDelay** | number | 1500 | Time in ms when touch scroll will be disabled after the last user interaction, if `touchScrollMode: "pageScrollTimer"` |
| **responsiveAspect** | string | 'width' | This option sets the side on which the sizes will be calculated. `width`: width should be controlled by css, height will be calculated by the plugin; `height`: use css to restrict height, width will be set by plugin. See [responsive behavior](#responsive) |
| **fastPreview** | Object &#124; false | false | Special mode when you want interactivity as quickly as possible, but you have a lot of pictures. It will only load a small set of images, after which it will be possible to interact with the plugin, and then full set of the images will be loaded. If enabled, ```preload```, ```preloadNumber``` and ```fps``` options will be applied to **fastPreview** images. See [examples below](#fast-preview) |
| **fastPreview.images** | Array&lt;string&gt; |  | Required if ```fastPreview``` is enabled. Array with urls of preview mode images. You could use a part of **options.images** array or completely different pictures, they will be replaced when full sequence is loaded  |
| **fastPreview.fpsAfter** | number |  | fps value that will be applied after the full list of images is loaded |
| **fastPreview.matchFrame** | function(number):number |  | A function that takes the frame number of the short set and returns the frame number of the full set. The function is called when the plugin switches to the full set of images, so that the animation doesn't jump after full load. Frame numbers start from 1. If not specified, first frame will be set |
| **onPreloadFinished** | function(AnimateImages) | | Callback, occurs when all image files have been loaded, receives plugin instance as a parameter |
| **onFastPreloadFinished** | function(AnimateImages) | | Callback, occurs when all ```fastPreview``` mode images have been loaded, receives plugin instance as a parameter |
| **onPosterLoaded** | function(AnimateImages) | | Callback, occurs when poster image is fully loaded, receives plugin instance as a parameter |
| **onAnimationEnd** | function(AnimateImages) | |  Callback, occurs when animation has ended, receives plugin instance as a parameter |
| **onBeforeFrame** | function(AnimateImages, {context, width, height}) | | Callback, occurs before new frame, receives plugin and canvas info as parameters. Can be used to change settings, for example ```imageSmoothingEnabled``` |
| **onAfterFrame** | function(AnimateImages, {context, width, height}) | | Callback, occurs after the frame was drawn, receives plugin and canvas info as parameters. Can be used to modify the canvas appearance. |

##### Callback example:
```javascript
 let instance1 = new AnimateImages(element, {
    images: imagesArray,
    poster: imagesArray[0],
    preload: "none",
    ...
    onPosterLoaded(plugin){
        plugin.preloadImages();// load all
    },
    onBeforeFrame(plugin, {context, width, height}){
        context.imageSmoothingEnabled = false;
    },
    onAfterFrame(plugin, {context, width, height}){
        context.fillStyle = "green";
        context.fillRect(10, 10, 100, 100);
    },
 });
```
> ```width``` and  ```height``` are internal canvas dimensions, they 
> depend on ```devicePixelRatio```

## <a name="methods"></a>Methods
>  Most methods can be chained (```instance.setReverse(true).play()```)

>  Methods that involve a frame change can be called before full load or even without any preload.
> Plugin will add this action to the queue and start downloading the frames. Only one last action is saved in the queue

### play
Start animation

`returns` {AnimateImages} - plugin instance

---

### stop
Stop animation

`returns` {AnimateImages} - plugin instance

---

### toggle
Toggle between start and stop

`returns` {AnimateImages} - plugin instance

---

### next
Show next frame

`returns` {AnimateImages} - plugin instance

---

### prev
Show previous frame

`returns` {AnimateImages} - plugin instance

---

### setFrame
Show a frame with a specified number (without animation)

`parameters`
- frameNumber {number} - Number of the frame to show
```javascript
instance.setFrame(35);
```
`returns` {AnimateImages} - plugin instance

---

### playTo
Start animation, that plays until the specified frame number

`parameters`
- frameNumber {number} - Target frame number
- options {Object}
    - options.shortestPath {boolean} - If set to true and loop is enabled, function will use the shortest path to the target frame,
      even if the path crosses edge frames. Default is **false**.
```javascript
// if current frame is 30 of 100, it will play from 30 to 85, 
// if current frame is 95, it will play from 95 to 85
instance.playTo(85);

// shortestPath
// if current frame is 2, it will play 1, 100, 99, 98
instance.playTo(98, {
    shortestPath: true
});
// (default) if current frame is 2, it will play 3, 4, 5 ... 97, 98
instance.playTo(98);
```
`returns` {AnimateImages} - plugin instance

---

### playFrames
Start animation in the current direction with the specified number of frames in the queue.
If `loop: false` animation will stop when it reaches the first or the last frame.

`parameters`
- numberOfFrames {number} - Number of frames to play
```javascript
instance.playFrames(200);
```
`returns` {AnimateImages} - plugin instance

---

### setReverse
Change the direction of the animation. Alias to ```setOption('reverse', true)```

`parameters`
- reverse {boolean} - true for backward animation, false for forward, default ```true```
```javascript
instance.setReverse(true);
```
`returns` {AnimateImages} - plugin instance

---


### getReverse
Get current reverse option. Alias to ```getOption('reverse')```

`returns` {boolean} - reverse or not

---

### setForward
Change the direction of the animation. It does the opposite effect 
of ```setReverse()```

`parameters`
- forward {boolean} - true for forward animation, false for backward, default ```true```

`returns` {AnimateImages} - plugin instance

---

### preloadImages
Start preload specified number of images, can be called multiple times. 
If all the images are already loaded, then nothing will happen

`parameters`
- number {number} - (optional) Number of images to load. If not specified, all remaining images will be loaded.
```javascript
instance.preloadImages(15);
```
`returns` {AnimateImages} - plugin instance

---

### updateCanvas
Calculate new canvas dimensions. Should be called after the canvas size was changed in 
the browser.  It's called automatically after window ```resize``` event

`returns` {AnimateImages} - plugin instance

---

### getOption
Returns option value

`parameters`
- option {string} - Option name. All options are allowed
```javascript
let reverse = instance.getOption('reverse');
```
`returns` {*} - current option value

---

### setOption
Set new option value

`parameters`
- option {string} -  Option name. Allowed options: `fps`, `loop`, `reverse`, `inversion`, `ratio`, `fillMode`, 
  `draggable`, `dragModifier`, `touchScrollMode`, `pageScrollTimerDelay`, `onPreloadFinished`, `onFastPreloadFinished`, 
  `onPosterLoaded`, `onAnimationEnd`, `onBeforeFrame`, `onAfterFrame`
- value {*} -  New value

`returns` {AnimateImages} - plugin instance
```javascript
instance.setOption('fps', 40);
instance.setOption('ratio', 2.56);
```

---

### getCurrentFrame
Returns the current frame number. Frames start from 1

`returns` {number} - Frame number

---

### getTotalImages
Returns the total images count (considering loading errors)

`returns` {number}

---

### getRatio
Returns the current canvas ratio. It may differ from the 
value in the `options.ratio`

`returns` {number}

---

### isAnimating
Returns true if the animation is running, and false if not

`returns` {boolean}

---

### isDragging
Returns true if a drag action is in progress

`returns` {boolean}

---

### isPreloadFinished
Returns true if all the images are loaded and plugin is ready to 
change frames

`returns` {boolean}

---

### isFastPreloadFinished
Returns true if ```fastPreview``` mode preload finished and plugin is ready to
change frames

`returns` {boolean}

---

### isLoadedWithErrors
Returns true if at least one image wasn't loaded because of error

`returns` {boolean}

---

### reset
Stop the animation and return to the first frame

`returns` {AnimateImages} - plugin instance

---

### destroy
Stop animation, remove event listeners and clear the canvas. 
Method doesn't remove canvas element from the DOM

---


## <a name="events"></a>Events
Plugin fires all the events on the canvas element.

**animate-images:loading-progress** - 
Fires after every image load. Progress amount is in `event.detail.progress`

**animate-images:loading-error** - 
Fires after every image.onerror

**animate-images:preload-finished** -
Fires when all the images have been loaded, and the plugin is ready to play

**animate-images:fast-preload-finished** -
Fires when all ```fastPreview``` images have been loaded, and the plugin is 
ready to play

**animate-images:poster-loaded** -
Fires when poster has been loaded

**animate-images:animation-end** -
Fires after the animation end. If the second animation was started 
while the first was active, this event will be fired only after the 
second animation end.

**animate-images:drag-start** -
Fires when user starts dragging. Frame number is in `event.detail.frame`

**animate-images:drag-change** -
Fires on every frame change while dragging. Frame number is in `event.detail.frame`, direction 
(`left` or `right`) is in `event.detail.direction`.

**animate-images:drag-end** -
Fires when user stops dragging. Frame number is in `event.detail.frame`, direction
(`left` or `right`) is in `event.detail.direction`.

Example:
```javascript
let element = document.querySelector('canvas.canvas_el');
let instance = new AnimateImages(element, options);
element.addEventListener('animate-images:loading-progress', function (e){
    console.log(Math.floor(e.detail.progress * 100) + '%');
});
```

## <a name="fast-preview"></a>fastPreview mode
<details>
    <summary>Examples</summary>

```javascript
// load only fastPreview images, start playing at 5 fps, then load all the images, 
// replace small set with full as soon as it loads, and continue playing at 30fps
new AnimateImages(element, {
    images: imagesArray,
    autoplay: true,
    fps: 5, // fps for fastPreview
    ...
    fastPreview: {
        images: imagesArray.filter( (val, i) => i % 5 === 0 ),// use every 5th image (imagesArray[0], imagesArray[5], ...)
        fpsAfter: 30, // continue with 30fps
        matchFrame: function (currentFrame){
            return ((currentFrame-1) * 5) + 1; // 1 => 1, 2 => 6, 3 => 11, ...
        },
    }
}

// call play(), it will load and start fastPreview, then switch to full sequence
let instance1 = new AnimateImages(element, {
    images: imagesArray,
    ...
    fastPreview: {
        images: imagesArray.filter( (val, i) => i % 10 === 0 ),
    }
}
button.addEventListener("click", () => { instance1.play() });

// preload only 3 images, wait for user interaction, load the rest of fastPreview images, start playing,
// then load full sequence
let instance2 = new AnimateImages(element, {
    images: imagesArray,
    preload: "partial", // preload is applied to fastPreview only
    preloadNumber: 3,
    ...
    fastPreview: {
        images: imagesArray.filter( (val, i) => i % 10 === 0 ),// use every 10th image (imagesArray[0], imagesArray[10], etc)
    }
}
button.addEventListener("click", () => { instance2.play() }); // play() always loads the rest before playing

// start loading only after some event, play after user interaction, then load the rest
let instance3 = new AnimateImages(element, {
    images: imagesArray,
    preload: "none",
    fastPreview: {
        images: imagesArray.filter( (val, i) => i % 10 === 0 ),
    }
}
...
someModalOpenCallback(){ instance3.preloadImages() } // will load only fastPreview images
buttonInsideModal.addEventListener("click", () => { instance3.play() }); // it's safe to call even without any preload

// preload all fastPreview images, start loading full sequnce after that, but wait for interaction to play
let instance4 = new AnimateImages(element, {
    images: imagesArray,
    preload: "all", // will load only fastPreview.images
    fastPreview: {
        images: imagesArray.filter( (val, i) => i % 10 === 0 ),
    },
    onFastPreloadFinished: (plugin) => {
        plugin.preloadImages();
    }
}
// initially will start short sequnce if full in not ready, otherwise will start the full
buttonInsideModal.addEventListener("click", () => { instance4.play() });
```
</details>

## <a name="browser_support"></a>Browser support

* latest versions of Chrome, android Chrome, Edge, Firefox
* Safari 13.1+,
* iOS Safari 13.4+

## <a name="license"></a>License
AnimateImages is provided under the [MIT License](https://opensource.org/licenses/MIT)


  
