# [PaulWheeler.us](http://www.paulwheeler.us/)

## About

This is the source code for my personal website, which is just a landing page with a bit of information about myself. This site is static content hosted in a google cloud bucket. The site is generated using a modified version of [Eleventy](https://github.com/sflanker/eleventy) from [Handlebars](https://handlebarsjs.com/) templates with [YAML](https://yaml.org/) files and [Sass](https://sass-lang.com/) style sheets. In an effort to avoid bloat my goal was to use as little JavaScript as possible, and this page has a single inline event handler to make the page's scroll position accessible to css rules.

### Applying CSS Styles Based on Scroll

There is no CSS accessible attribute or selector that indicates a page or elements current scroll position. In order to make the current scroll position something that CSS Styles can be applied based on, it is necessary to use a javascript event handler to store the scrollY property as a data attribute:

```html
<body onscroll="document.documentElement.dataset.scroll = window.scrollY.toString()">
...
</body>
```

Once this is applied, CSS selectors can use this attribute:

```css
html:not([data-scroll='0']) #header_bar #avatar_title img {
    width: 48px;
    height: 48px;
    margin-right: 14px;
}
```

Because CSS does not have less-than or greater-than operators if you want to use a threshold besides `0`/`1+`, it is necessary to add some computation to the event handler, in my case I chose `63`/`64+` as the threshold, and so I used the following javascript in my event handler:

```javascript
document.documentElement.dataset.scroll = (window.scrollY >> 6).toString()
```

### Changing SVG Color With CSS

For the social media links on the page I wanted to use a single, external SVG for each logo. However, I also wanted to have the logos' brand color appear when the user moused over them.

When SVG content is directly inlined into a webpage it is possible to style its elements using CSS, but  when an external SVG is embedded with an `<img />` tag this is not possible. However, this is a workaround so long as you only need to change a single color:

#### Step 1. Modify Your SVG

You must modify the SVG elements you wish to style with CSS so that the color you want to style (generally stroke or fill) is set to `'currentColor'`. You also need to modify your SVG so that its contents are declared as a named definition. You can then `xlink` this definition into the body of the SVG so that it renders correctly when used with an `<img />` tag.

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 100 100" height="100" width="100">
  <defs>
    <circle id="logo" cx="50" cy="50" r="40" fill="currentColor" />
  </defs>
  <g style="color: red">
    <!-- The embedded element inherits the color from its parent anywhere
         currentColor is used -->
    <use xlink:href="#logo" x="0" y="0" />
  </g>
</svg>
```

#### Step 2. Embed the Named Definition in an SVG Element

In order to embed the element such that it inherits the current color from its container we use an inline `<svg>` element:

```html
<html>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
       class="logo" viewBox="0 0 100 100" width="100" height="100">
    <!-- #logo here corresponds to the name of the definition in test.svg -->
    <use xlink:href="test.svg#logo"></use>
  </svg> 
</body>
</html>
```

#### Step 3. Apply the CSS

```css
.logo {
  color: red;
}
.logo:hover {
  color: blue;
}
```

## Résumé

One of the conundrums I always face when preparing a résumé is finding the right level of detail. On the one hand I don't want a recruiter or hiring manager to get bogged down going through every bit of experience I've had, but on the other hand I think each role I've had contributes something to the person I am the complete litany gives the most accurate view. This situation is exacerbated by the complex work history I have managed to cultivate by working for numerous startups and taking breaks to sail around the Pacific.

Fortunately necessity is the mother of invention, and pondering this lead me to a novel insight: what if I used responsive CSS to allow the reader to see multiple levels of detail?

### CSS Styling Basted on an HTML5 Range Input

Using a conditional CSS selector and the general sibling combinator it is possible to adjust the visibility of elements based on the value of an `input`. For example given the following HTML:

```html
<html>
<body>
<input type="range" min="0" max="2" value="1" />
<p>The following text should change size when the slider is moved:</p>
<p class="adjustable">Adjustable Font Size</p>
</body>
</html>
```

It is possible to change the font size of the "adjustable" paragraph with the following CSS:

```css
input[value='0'] ~ p.adjustable { font-size: 8pt; }
input[value='1'] ~ p.adjustable { font-size: 16pt; }
input[value='2'] ~ p.adjustable { font-size: 24pt; }
```

However, HTML input elements don't actually update their `value` attributes when their values change, so it is necessary to add a small event handler to persist the value in a way that CSS can leverage:

```html
<input type="range" min="0" max="2" value="1"
       onchange="this.setAttribute('value', this.value)"
       onmousemove="this.setAttribute('value', this.value)" />
```

In the case of my resume I used this detail slider to show and hide less significant details about my experience, skills, an education. On narrow screen sizes the slider disappears and the level of detail is locked in at zero.

### Microformats

Microformats make it possible to combine structured data with a view designed for human readability. Specially defined CSS classes are used to denote the elements and attributes that contain specific pieces of data. In theory this would allow a compatible extractor to quickly and reliably parse the critical elements of the resume into a structured database.
