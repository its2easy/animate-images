<h1 align="center">
   Animate Images
</h1>

![npm](https://img.shields.io/npm/v/@its2easy/animate-images)

Demo - [codepen](https://codepen.io/its2easy/pen/powQJmd)

**animate-images** is a lightweight (17kb without gzip) library that animates a sequence of images 
to use in animations or pseudo 3d product view. It works WITHOUT BUILT-IN UI and mainly 
developed for complex animations.

To use it you have to get a series of frames from a video or 3d app. 
The frames must be separate images of the same size.

* [Installation](#installation)
* [Usage](#usage)
* [Options](#options)
* [Methods](#methods)
* [Events](#events)
* [Browser support](#browser_support)
* [License](#license)
* [Changelog](#changelog)

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
let instance = animateImages.init(element, options)
```
### npm
```
npm i @its2easy/animate-images --save
```
```javascript
import { init as animateImages } from '@its2easy/animate-images';
let instance = animateImages(element, options);
```

It is possible to directly import untranspiled esm version, which is smaller:
```javascript
import { init as animateImages } from '@its2easy/animate-images/build/untranspiled/animate-images.esm.min.js'; //or animate-images.esm.js
let instance = animateImages(element, options);
```
> :warning: You should probably add it to your build process if you use esm version. Example for webpack:
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
#### All available versions:
umd build:

`@its2easy/animate-images/build/animate-images.umd.min.js` - default for browser script tag and legacy bundlers

esm builds processed whit babel:

`@its2easy/animate-images/build/animate-images.esm.min.js` - default for webpack and module environments

`@its2easy/animate-images/build/animate-images.esm.js`

esm builds without babel transformation:

`@its2easy/animate-images/build/untranspiled/animate-images.esm.min.js`

`@its2easy/animate-images/build/untranspiled/animate-images.esm.js`

:information_source: If you are using **webpack 4** and babel with quite modern target browsers,
then you might get an error while importing, because webpack 4 doesn't support some modern js
syntax and babel doesn't transpile it because browsers support for this syntax is high enough now.
Use **webpack 5** to fix it.

## <a name="usage"></a>Usage
Create canvas element 
```html
 <canvas class="canvas_el" width="800" height="500"></canvas>
```

Initialize with options
```javascript
let element = document.querySelector('.canvas_el');
let imagesArray = Array.from(new Array(90), (v, k) => { // generate array of urls
    let number = String(k).padStart(4, "0");
    return `path/to/your/images/frame-${number}.jpg`;
});
let instance = animateImages.init(element,
    {
        images: imagesArray, /* required */
        preload: "partial",
        preloadNumber: 20,
        loop: true,
        fps: 60,
        poster: 'path/to/poster/image.jpg',
    }
);
instance.play();
```

Methods called from `onPreloadFinished` callback will start immediately, but you have to use `options.preload: 'all'`
or call `plugin.preload()`. The plugin loads each image only once, so it's safe to call `preload` multiple times, 
even after the load has been completed. If `autoplay: true`, full preload will start immediately.
```javascript
let instance = animateImages.init(element,
    {
        images: imagesArray,
        preload: "none", // if 'all', you don't need to call preload()
        onPreloadFinished: function (lib){
            lib.play();
        }
    }
);
instance.preload(30);//load the first part

setTimeout(() => {
 instance.preload(60);// laod the rest
}, 1000);
// or instance.preload() to load all the images
```
Methods that were called from outside of `onPreloadFinished` will trigger the load of all unloaded images, 
wait for the full load, and then execute the action. if multiple methods have been called before 
load, only the last will be executed
```javascript
let instance = animateImages.init(element,
    {
        images: imagesArray,
        preload: "none", 
    }
);
// if preload: "none", it will trigger the load, and play after each image loaded
// if preload: "all", it will wait until full load and then start
instance.play(); 
```
In general, the plugin will load all the frames before any action, but you can preload a part of the 
images in some cases, for example when user is scrolling to the section in which the animation will 
take place.

### Sizes and responsive behavior
Width of the canvas is defined by page CSS. To calculate height, plugin uses ratio from
inline width and height canvas properties `<canvas width="1600" height="900">` (if they're not set, default
 are 300x150). This ratio can be overwritten by `options.ratio`. Height of the canvas should be `'auto'` and 
not fixed by CSS. If the height is fixed, the ratio can't be used, and the canvas will use its natural CSS 
size. The dimensions of the images are taken from the image itself after load, and they do not need to be 
set anywhere in the settings.

If the canvas and images have the same ratio, full image will be displayed. If the ratios are the same, 
but sizes are different, image will be scaled to fit the canvas. On the page the canvas with the image will
be scaled to canvas CSS size.

If canvas and image ratios are different, then image will use `options.fillMode`, which works like 
background-size `cover` and `contain`. Image will be centered.

So to display the full image, check the image width and height, and set it as canvas inline `width` and `height` 
(or set `options.ratio`).
Then set canvas width by CSS (width="500px" or width="100%" or max-width="800px" etc), and don't set 
canvas height. 

For example, &lt;canvas width="800" height="400"&gt;, image 1200x600, canvas has css max-width="500px". 
Image will be scaled to 800x400 inside canvas and fully visible, canvas on the page will be displayed 
500px x 250px.

After page resize, the sizes will be recalculated automatically, but if canvas was resized by script, call 
`instance.updateCanvas()`

### Loading error
All images that were loaded with errors will be removed from the array of frames. Duration 
of the animation will be recalculated.  

New frames count could be obtained in preload callback:
```javascript
animateImages.init(element,
    {
        ...
        onPreloadFinished: function (instance){
            if ( instance.isLoadedWithErrors() ) {
                let newFramesCount = instance.getTotalImages();
            }
        },
    }
```

## <a name="options"></a>Options

```javascript
animateImages(element, options);
```
element : HTMLCanvasElement - required canvas DOM node (HTMLCanvasElement) 

options:

| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---:| :---: | :---  |
| **images** | Array&lt;String&gt; | :heavy_check_mark: | | Array with images URLs |
| **preload** | String | | 'all' | Preload mode ("all", "none", "partial") |
| **preloadNumber** | Number | | 0 | Number of images to preload when `option.preload="partial"` (0 for all images) |
| **fps** | Number | | 30 | FPS when playing. Determines the duration of the animation (for ex. 90 images and 60 fps = 1.5s, 90 images and 30fps = 3s) |
| **poster** | String | | | URL of the poster image, to show before the full load |
| **loop** | Boolean | | false | Whether to loop the animation | 
| **reverse** | Boolean | | false | Reverse direction |
| **autoplay** | Boolean | | false | If true, starts the animation automatically on load |
| **draggable** | Boolean | | false | Draggable by mouse or touch |
| **touchScrollMode** | String | | "pageScrollTimer" | Page scroll behavior with touch events _(only for events that fire in the plugin area)_. Available modes: **preventPageScroll** - touch scroll is always disabled. **allowPageScroll** - touch scroll is always enabled. **pageScrollTimer** - after the first interaction the scroll is not disabled; if the time between the end of the previous interaction and the start of a new one is less than _pageScrollTimerDelay_, then scroll will be disabled; if more time has passed, then scroll will be enabled again    |
| **pageScrollTimerDelay** | Number | | 1500 | Time in ms when touch scroll will be disabled after the last user interaction, if touchScrollMode = "pageScrollTimer" |
| **ratio** | Number | | false | Canvas width/height ratio, it takes precedence over canvas inline width and height |
| **fillMode** | String | | 'cover' | Fill mode to use if canvas and image aspect ratios are different. Can be "cover" or "contain" |
| **onPreloadFinished** | Function | | | Callback, occurs when all image files have been loaded, receives plugin instance as a parameter |
| **onPosterLoaded** | Function | | | Callback, occurs when poster image is fully loaded, receives plugin instance as a parameter |
| **onBeforeFrame** | Function | | | Callback, occurs before new frame, receives canvas context as a parameter. Can be used to change settings, for example ```imageSmoothingEnabled``` |
| **onAfterFrame** | Function | | | Callback, occurs after the frame was drawn, receives canvas context as a parameter. Can be used to change the image. |

##### Callback example:
```javascript
 let instance1 = animateImages.init(element, {
    images: imagesArray,
    ...
    onBeforeFrame(context, {width, height}){
        context.imageSmoothingEnabled = false;
    },
    onAfterFrame(context, {width, height}){
        context.fillStyle = "green";
        context.fillRect(10, 10, 100, 100);
    },
 });
```
> ```width``` and  ```height``` are internal canvas dimensions, they 
> depend on ```devicePixelRatio```

## <a name="methods"></a>Methods
>  Most methods can be chained (```instance.setReverse(true).play()```)

### play
Start animation

`returns` {Object} - plugin instance

---

### stop
Stop animation

`returns` {Object} - plugin instance

---

### togglePlay
Toggle between start and stop

`returns` {Object} - plugin instance

---

### next
Show next frame

`returns` {Object} - plugin instance

---

### prev
Show previous frame

`returns` {Object} - plugin instance

---

### setFrame
Show a frame with a specified number

`parameters`
- frameNumber {Number} - Frame number
```javascript
instance.setFrame(35);
```
`returns` {Object} - plugin instance

---

### playTo
Starts the animation, which plays until the specified frame number

`parameters`
- frameNumber {Number} - Target frame number
```javascript
// if current frame is 30 of 100, it will play from 30 to 85, 
// if current frame is 95, it will play from 95 to 85
instance.playTo(85);
```
`returns` {Promise&lt;Object&gt;} - Promise, that resolves after the animation end, 
receives plugin instance as a parameter to resolve function

---

### playFrames
Starts animation in the current direction with the specified number 
of frames in queue. If `options.loop: false` animation will stop 
when it reaches the first or the last frame.

`parameters`
- numberOfFrames {Number} - Number of frames to play
```javascript
instance.playFrames(200);
```
`returns` {Promise&lt;Object&gt;} - Promise, that resolves after the animation end,
receives plugin instance as a parameter to resolve function

---

### reset
Stop the animation and return to the first frame

`returns` {Object} - plugin instance

---

### destroy
Stop animation, clear the canvas and remove event handlers.
Method doesn't remove canvas element from the DOM

---

### setReverse
Changes `reverse` option

`parameters`
- reverse {Boolean} - true for backward animation, false for forward
```javascript
instance.setReverse(true);
```
`returns` {Object} - plugin instance

---

### preloadImages
Start preloading specified number of images. Сan be called multiple times. 
If all the images are already loaded then nothing will happen

`parameters`
- number {Number} - number of images to load. If not specified, all remaining images will be loaded.
```javascript
instance.preloadImages(15);
```
`returns` {Object} - plugin instance

---

### updateCanvas
Calculate new canvas dimensions. Should be called after the canvas size was changed in 
the browser

`returns` {Object} - plugin instance

---

### getOption
Returns option value

`parameters`
- option {String} -  Option name. Allowed options: fps, loop, reverse, poster, autoplay, fillMode, 
  draggable, touchScrollMode, pageScrollTimerDelay.
```javascript
let reverse = instance.getOption('reverse');
```
`returns` {*} - Option value

---

### setOption
Set new option value

`parameters`
- option {String} -  Option name. Allowed options: fps, loop, reverse, ratio, fillMode, 
  draggable, touchScrollMode, pageScrollTimerDelay.
- value {*} -  New value
```javascript
instance.setOption('fps', 40);
instance.setOption('ratio', 2.56);
```

---

### getCurrentFrame
Returns the current frame number. Frames start from 1

`returns` {Number} - Frame number

---

### getTotalImages
Returns the total images count

`returns` {Number}

---

### getRatio
Returns the current canvas ratio. It may differ from the 
value in the options.ratio

`returns` {Number}

---

### isAnimating
Returns true if the animation is running, and false if not

`returns` {Boolean}

---

### isPreloadFinished
Returns true if all the images are loaded and plugin is ready to 
change frames

`returns` {Boolean}

---

### isLoadedWithErrors
Returns true if at least one image wasn't loaded because of error

`returns` {Boolean}

---


## <a name="events"></a>Events
Plugin fires all the events on the canvas element.

**animate-images:loading-progress** - 
Fires after every image load. Progress amount is in `event.detail.progress`

**animate-images:loading-error** - 
Fires after every image.onerror

**animate-images:preload-finished** -
Fires when all the images have been loaded, and the plugin is ready to play

**animate-images:poster-loaded** -
Fires when poster has been loaded

**animate-images:animation-end** -
Fires after the animation end. If the second animation was started 
while the first was active, this event will be fired only after the 
second animation end.

**animate-images:drag-start** -
Fires when user starts dragging. Frame number is in `event.detail.frame`

**animate-images:drag-change** -
Fires on every frame change while dragging. Frame number is in `event.detail.frame`

**animate-images:drag-end** -
Fires when user stops dragging. Frame number is in `event.detail.frame`

Example:
```javascript
let element = document.querySelector('.canvas_el');
let instance = animateImages.init(element, options);
element.addEventListener('animate-images:loading-progress', function (e){
    console.log(Math.floor(e.detail.progress * 100) + '%');
});
```

## <a name="browser_support"></a>Browser support

* latest versions of Chrome, android Chrome, Edge, Firefox
* Safari 13.1+,
* iOS Safari 13.4+

## <a name="license"></a>License
Animate Images is provided under the [MIT License](https://opensource.org/licenses/MIT)

## <a name="changelog"></a>Changelog
### 1.5.2
- ```preventTouchScroll``` replaced with ```touchScrollMode``` and ```pageScrollTimerDelay```
### 1.5.1
- add ```preventTouchScroll``` option
### 1.5.0
- fix blurry images when devicePixelRatio > 1
- add ```onBeforeFrame``` and ```onAfterFrame``` callbacks with access to the 
  canvas context
### 1.4.0
- add ```animate-images:drag-start```, ```animate-images:drag-change``` and 
```animate-images:drag-end ``` events
### 1.3.2
- fix wrong height after resize when canvas width/height ratio is 
  a fractional number
### 1.3.1
- fix readme
### 1.3.0
- change build
### 1.2.0
- plugin has been rewritten with classes
  
