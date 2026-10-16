import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import ResponsiveImages from './demos/ResponsiveImages.jsx';
import responsiveImagesCode from './demos/ResponsiveImages.jsx?raw';
import ObjectFit from './demos/ObjectFit.jsx';
import objectFitCode from './demos/ObjectFit.jsx?raw';
import objectFitCss from './demos/ObjectFit.module.css?raw';
import ImageStates from './demos/ImageStates.jsx';
import imageStatesCode from './demos/ImageStates.jsx?raw';
import imageStatesCss from './demos/ImageStates.module.css?raw';
import Figures from './demos/Figures.jsx';
import figuresCode from './demos/Figures.jsx?raw';
import Gallery from './demos/Gallery.jsx';
import galleryCode from './demos/Gallery.jsx?raw';
import lightboxCode from './demos/Lightbox.jsx?raw';
import galleryCss from './demos/Gallery.module.css?raw';
import NativeMedia from './demos/NativeMedia.jsx';
import nativeMediaCode from './demos/NativeMedia.jsx?raw';
import CustomVideoPlayer from './demos/CustomVideoPlayer.jsx';
import customVideoPlayerCode from './demos/CustomVideoPlayer.jsx?raw';
import mediaPlayerCss from './demos/MediaPlayer.module.css?raw';
import CustomAudioPlayer from './demos/CustomAudioPlayer.jsx';
import customAudioPlayerCode from './demos/CustomAudioPlayer.jsx?raw';
import DrawingCanvas from './demos/DrawingCanvas.jsx';
import drawingCanvasCode from './demos/DrawingCanvas.jsx?raw';
import drawingCanvasCss from './demos/DrawingCanvas.module.css?raw';
import AnalogClock from './demos/AnalogClock.jsx';
import analogClockCode from './demos/AnalogClock.jsx?raw';
import analogClockCss from './demos/AnalogClock.module.css?raw';
import ProgressRing from './demos/ProgressRing.jsx';
import progressRingCode from './demos/ProgressRing.jsx?raw';
import IconGallery from './demos/IconGallery.jsx';
import iconGalleryCode from './demos/IconGallery.jsx?raw';
import MapEmbed from './demos/MapEmbed.jsx';
import mapEmbedCode from './demos/MapEmbed.jsx?raw';
import Backgrounds from './demos/Backgrounds.jsx';
import backgroundsCode from './demos/Backgrounds.jsx?raw';
import backgroundsCss from './demos/Backgrounds.module.css?raw';

export default function MediaPage() {
  return (
    <>
      <PageHeader
        eyebrow="HTML Elements"
        title="Media & Graphics"
        intro="Images, video, audio, drawing and embedded content. Most media elements are driven imperatively (play(), pause(), drawing on a canvas), so this page is also the best place to see useRef and DOM events in action."
        concepts={['<img srcSet>', '<picture>', 'onLoad / onError', 'createPortal', '<video> / <audio>', 'useRef', '<canvas>', 'pointer events', 'inline SVG', '<iframe>']}
        docs={[
          { label: 'Manipulating the DOM with refs', href: 'https://react.dev/learn/manipulating-the-dom-with-refs' },
          { label: 'createPortal', href: 'https://react.dev/reference/react-dom/createPortal' },
          { label: 'MDN: Responsive images', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images' },
          { label: 'MDN: Canvas tutorial', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial' },
        ]}
      />

      <SectionTitle
        title="Images"
        intro="The humble <img> has grown a lot of superpowers: lazy loading, responsive sources, modern formats and events for loading states."
      />
      <DemoCard
        title="Responsive images: srcSet, sizes and <picture>"
        description="The browser downloads only the file that fits the screen. The captions show which file it actually chose (read from currentSrc in onLoad)."
        concepts={['alt', 'width / height', 'loading="lazy"', 'srcSet + sizes', '<picture> <source>', 'currentSrc']}
        code={responsiveImagesCode}
        filename="ResponsiveImages.jsx"
      >
        <ResponsiveImages />
      </DemoCard>

      <DemoCard
        title="object-fit and object-position"
        description="One wide photo in five differently-behaving boxes. Change the position and aspect ratio to see what gets cropped."
        concepts={['object-fit', 'object-position', 'aspect-ratio', 'inline style object']}
        files={[
          { name: 'ObjectFit.jsx', code: objectFitCode },
          { name: 'ObjectFit.module.css', code: objectFitCss },
        ]}
      >
        <ObjectFit />
      </DemoCard>

      <DemoCard
        title="Loading skeleton and error fallback"
        description="A reusable <SmartImage> that shows a shimmer while loading and a placeholder if the image fails. Reload to watch the states again."
        concepts={['onLoad', 'onError', 'status state', 'key to reset state', 'skeleton']}
        files={[
          { name: 'ImageStates.jsx', code: imageStatesCode },
          { name: 'ImageStates.module.css', code: imageStatesCss },
        ]}
      >
        <ImageStates />
      </DemoCard>

      <DemoCard
        title="<figure> and <figcaption>"
        description="Figures are self-contained content with a caption – a photo, but also a chart or a code listing."
        concepts={['<figure>', '<figcaption>', 'inline SVG chart', 'role="img"']}
        code={figuresCode}
        filename="Figures.jsx"
      >
        <Figures />
      </DemoCard>

      <SectionTitle
        title="Gallery & lightbox"
        intro="A classic pattern that combines state, conditional rendering, portals, keyboard events and focus management."
      />
      <DemoCard
        title="Image gallery with a lightbox"
        description="Click a photo, then use ← → to browse, Esc or the backdrop to close. Focus returns to the photo you opened."
        concepts={['createPortal', 'role="dialog"', 'aria-modal', 'focus trap', 'onKeyDown', 'useEffect cleanup']}
        files={[
          { name: 'Gallery.jsx', code: galleryCode },
          { name: 'Lightbox.jsx', code: lightboxCode },
          { name: 'Gallery.module.css', code: galleryCss },
        ]}
      >
        <Gallery />
      </DemoCard>

      <SectionTitle
        title="Video & audio"
        intro="Start with the native players; build your own controls only when the design demands it."
      />
      <DemoCard
        title="Native <video> and <audio>"
        description="The browser’s built-in players. Toggle the controls and loop attributes to see them update."
        concepts={['controls', 'poster', 'preload', 'playsInline', '<source>', 'fallback content']}
        code={nativeMediaCode}
        filename="NativeMedia.jsx"
      >
        <NativeMedia />
      </DemoCard>

      <DemoCard
        title="Custom video player"
        description="Play/pause, seek, skip, volume, speed and full screen – all through a ref. The log shows the media events the UI listens to."
        concepts={['useRef', 'play() / pause()', 'currentTime', 'onTimeUpdate', 'onLoadedMetadata', 'onEnded', 'requestFullscreen']}
        files={[
          { name: 'CustomVideoPlayer.jsx', code: customVideoPlayerCode },
          { name: 'MediaPlayer.module.css', code: mediaPlayerCss },
        ]}
      >
        <CustomVideoPlayer />
      </DemoCard>

      <DemoCard
        title="Custom audio player"
        description="The same ideas for sound: an invisible <audio> element and our own play button, progress bar and volume."
        concepts={['<audio>', 'useRef', 'volume', 'onPlay / onPause', 'CSS animation']}
        files={[
          { name: 'CustomAudioPlayer.jsx', code: customAudioPlayerCode },
          { name: 'MediaPlayer.module.css', code: mediaPlayerCss },
        ]}
      >
        <CustomAudioPlayer />
      </DemoCard>

      <Callout type="tip" title="Refs are an escape hatch">
        <p>
          React normally owns the DOM. A ref is how you step outside when you need an element’s own methods:
          <code>video.play()</code>, <code>input.focus()</code>, <code>canvas.getContext()</code>,{' '}
          <code>element.scrollIntoView()</code>. Read or write <code>ref.current</code> in event handlers and
          effects – never during render.
        </p>
      </Callout>

      <SectionTitle
        title="Drawing & graphics"
        intro="Canvas is a bitmap you paint on with JavaScript; SVG is a tree of shapes you describe with JSX. Icons are SVG too."
      />
      <DemoCard
        title="Canvas drawing pad"
        description="Draw with a mouse, finger or stylus (pens get pressure-sensitive lines). Undo, clear and download your drawing as a PNG."
        concepts={['<canvas>', 'getContext("2d")', 'pointer events', 'setPointerCapture', 'devicePixelRatio', 'getImageData', 'toDataURL']}
        files={[
          { name: 'DrawingCanvas.jsx', code: drawingCanvasCode },
          { name: 'DrawingCanvas.module.css', code: drawingCanvasCss },
        ]}
      >
        <DrawingCanvas />
      </DemoCard>

      <DemoCard
        title="SVG analog clock"
        description="An inline SVG whose hands are rotated from state. A 1-second interval (with cleanup!) keeps it ticking; pick another time zone to move the hands."
        concepts={['inline SVG', 'transform="rotate()"', 'setInterval', 'useEffect cleanup', 'Array.from', 'Intl time zones']}
        files={[
          { name: 'AnalogClock.jsx', code: analogClockCode },
          { name: 'AnalogClock.module.css', code: analogClockCss },
        ]}
      >
        <AnalogClock />
      </DemoCard>

      <DemoCard
        title="SVG progress ring"
        description="A reusable ring component drawn with stroke-dasharray. Drag the slider – the same component renders three sizes."
        concepts={['<circle>', 'strokeDasharray', 'strokeDashoffset', 'CSS transition', 'reusable props']}
        code={progressRingCode}
        filename="ProgressRing.jsx"
      >
        <ProgressRing />
      </DemoCard>

      <DemoCard
        title="Icons with lucide-react"
        description="Every icon is a component with size, color and strokeWidth props. Filter, adjust and copy the JSX for the one you need."
        concepts={['lucide-react', 'size / color / strokeWidth', 'component in a variable', 'aria-hidden', 'clipboard API']}
        code={iconGalleryCode}
        filename="IconGallery.jsx"
      >
        <IconGallery />
      </DemoCard>

      <Callout type="note" title="Canvas or SVG?">
        <p>
          Use <strong>SVG</strong> for a modest number of shapes that should be crisp at any size, styled with
          CSS and accessible (icons, charts, diagrams). Use <strong>canvas</strong> for thousands of objects or
          pixel work (drawing apps, games, image filters, heat maps) – but you must handle accessibility and
          resolution yourself.
        </p>
      </Callout>

      <SectionTitle
        title="Embeds & backgrounds"
        intro="Content from other sites with <iframe>, and decorative images and gradients with CSS."
      />
      <DemoCard
        title="Embedded map with <iframe>"
        description="An OpenStreetMap embed around Hawthorn. The iframe’s src is built from state, so the buttons simply change the URL."
        concepts={['<iframe>', 'title', 'loading="lazy"', 'sandbox', 'URLSearchParams', 'onLoad']}
        code={mapEmbedCode}
        filename="MapEmbed.jsx"
      >
        <MapEmbed />
      </DemoCard>

      <Callout type="warning" title="Only embed what you trust">
        <p>
          An iframe runs someone else’s code inside your page. Add <code>sandbox</code> and only allow what the
          embed needs (<code>allow-scripts</code>, <code>allow-same-origin</code>, <code>allow-popups</code>…), and
          grant browser features explicitly with <code>allow</code> (e.g. <code>allow="fullscreen"</code>). Many
          sites also refuse to be embedded at all using the <code>X-Frame-Options</code> header.
        </p>
      </Callout>

      <DemoCard
        title="Gradients and a hero banner"
        description="Layer a gradient over a photo for readable hero text, browse gradient presets, and build your own."
        concepts={['background-image', 'linear/radial/conic-gradient', 'layered backgrounds', 'background-size: cover', 'inline style']}
        files={[
          { name: 'Backgrounds.jsx', code: backgroundsCode },
          { name: 'Backgrounds.module.css', code: backgroundsCss },
        ]}
      >
        <Backgrounds />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>Lightbox.jsx</code>, add touch support: swipe left/right to change photo using{' '}
            <code>onPointerDown</code> and <code>onPointerUp</code> and the difference in <code>clientX</code>.
          </li>
          <li>
            In <code>CustomVideoPlayer.jsx</code>, remember the playback position in <code>localStorage</code>{' '}
            (or the shared <code>useLocalStorage</code> hook) and resume from it in <code>onLoadedMetadata</code>.
          </li>
          <li>
            Give <code>DrawingCanvas.jsx</code> a “Redo” button: keep a second stack of snapshots that{' '}
            <code>undo()</code> pushes onto.
          </li>
          <li>
            Turn the <code>Ring</code> in <code>ProgressRing.jsx</code> into a countdown timer: a button starts a
            60-second <code>setInterval</code> that lowers the value (don’t forget the cleanup).
          </li>
          <li>
            In <code>MapEmbed.jsx</code>, add your own campus or favourite study spot to <code>PLACES</code>.
          </li>
        </ol>
      </Callout>
    </>
  );
}
