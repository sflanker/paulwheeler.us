/*---
layout: article.hbs
tags: articles
subtitle: Custom 3D Geometry in P5.js
date: 2021-09-21 00:00:00-10
description: A guide to creating custom, procedurally generated three-dimensional geometry in a way that renders performantly using the p5.Geometry class.
---*/

## Introduction to 3D Geometry

In the context of this article 3D geometry is a set of triangles each defined by three corners, called vertices, in three-dimensional space. In addition to a position in 3D space, each vertex has a texture coordinate, and a normal. The texture coordinate is a 2D coordinate that specifies what part of the texture image should be mapped to that point. The normal is a 3D vector, meaning it represents a direction rather than a position, that indicates the degree to which that part of the triangle should be illuminated when a light is shining on it from a certain direction.

Graphics cards, and the APIs that allow programs to utilize them, are very efficient at drawing huge numbers of triangles every frame while still maintaining a high framerate. However, in order to harness this performance, the triangles that make up that scene must be prepared some very particular data structures. Triangle corner positions, texture coordinates, and normals are stored as arrays of numbers (3D vectors are unpacked into the array so that instead of a multi-dimensional array, or an array of arrays, you just have an array with 3 values per vector). The simplest way to draw geometry is to store it such that for every triangle all of its corners are listed independently in the various buffers. However, there is a more efficient way to represent geometry because often times multiple triangles will share the same vertex. This involves having an additional buffer with a list of vertex indices, three per triangle, that specify the index into the vertex buffer for corners of each triangle.

For more information on general concepts about 3D geometry I recommend the [Guides available on WebGLFundamentals.org](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html) especially the [one about Indexed Vertices](https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html).

## 3D Geometry in p5.js

Because p5.js draws graphics in immediate mode, all the triangles that make up the visible geometry must be drawn every frame. Because of this fact, it is very important for performance that the visible geometry be drawn very efficiently.

The individual 3D primitive functions in p5.js (such as [`box()`](https://p5js.org/reference/#/p5/box) and [`sphere()`](https://p5js.org/reference/#/p5/sphere)) do generate and reuse the efficient geometry representation described above. However, when you have a large number (thousands) of primitives on screen at once this will not be very fast. This is because WebGL and GPU are much better optimized when drawing large numbers of triangles as a single call, instead of drawing many smaller sets of triangles separately. Additionally, complex geometry constructed with [`beginShape()`](), [`vertex()`](), and [`endShape()`](), will definitely not be efficient since the vertex buffers generated for these will not be cached and reused at all.

One option to create efficient 3D geometry in p5.js is to create it in an external 3D modelling program such as [Blender](https://www.blender.org/), export the geometry as an OBJ file, and then load it into p5.js using [`loadModel()`](https://p5js.org/reference/#/p5/loadModel). However, it is also possible to generate geometry procedurally within p5.js.

## Creating Custom 3D Geometry

The [`p5.Geometry`](https://p5js.org/reference/#/p5.Geometry) class in p5.js is not particularly well documented. Each of its instance methods has only a cursory description, and the expected behavior of the callback function is completely lacking any specification. The goal of this article is to fill this gap.

### The `p5.Geometry` Constructor

The `p5.Geometry` constructor takes three parameters and initializes the geometry, however most of the actual work is done in within the callback function passed as the third parameter.

| Parameter | Description |
| --------- | ----------- |
| detailX   | The number of vertices to generate in the horizontal direction. |
| detailY   | The number of vertices to generate in the vertical direction. |
| callback  | A callback function that will be invoked once and is expected to populate the vertex array. |

#### Detail

The `detailX` and `detailY` parameters are intended to control the level of detail for the geometry that is generated. For most the built-in primitives the geometry is generated as vertical strips of triangles, so `detailX` controls the number of strips and `detailY` controls the number of rows per strip. However, when creating custom geometry there is nothing "magic" about these parameters! They are assigned to properties the `p5.Geometry` instance, they can be referenced in the callback as `this.detailX` and `this.detailY`, and they are used by the `computeFaces` instance method to automatically generate triangles based on the array of vertices (more on this later). Therefore, if you want your custom geometry to have configurable level of detail which can be described by these parameters then you should add support for them in your geometry callback, and if you don't need level of detail capability then you can ignore these.

#### Callback

The callback is where the heavy lifting is done. This callback function is invoked immediately from the `p5.Geometry` constructor as an instance member of the new `p5.Geometry` instance (i.e. `this` is bound to the `p5.Geometry` object that was created). Technically the callback is optional and any initialization that can be performed in the callback can also be performed after the constructor returns.

### Initializing Basic Geometry

As was alluded to in the introduction to 3D geometry above, There are three critical data structures that must be initialized: `vertices`, `faces`, and `vertexNormals`. In order to support textures it is also necessary to initialize the `uvs` array.

3D geometry in p5.js is made up entirely of triangles. The corners of each triangle must be specified as `p5.Vector` objects added to the `vertices` array. Let's start out with an extremely simple geometry: a single, arbitrary triangle.

``` js
let m;

function setup() {
  createCanvas(400, 400, WEBGL);
  m = createModel();
}

function draw() {
  background(100);
  orbitControl(2, 1, 0.05);
  model(m);
}

function createModel() {
  return new p5.Geometry(
    // detailX and detailY are not used in this example
    1, 1,
    // The callback must be an anonymous function, not an arrow function in
    // order for "this" to be bound correctly.
    function createGeometry() {
      this.vertices.push(
        new p5.Vector(-27, -56, 10),
        new p5.Vector(33, -12, 5),
        new p5.Vector(7, 46, 2)
      );
    }
  );
}
```

Most of the above code is just boilerplate to initialize the sketch, create the model once, and the draw it for each frame (using `orbitControl()` to allow the camera to be manipulated with the mouse). The critical code for constructing geometry here is the addition of three `p5.Vector`s to the `vertices` array:

```javascript
      // ...

      this.vertices.push(
        new p5.Vector(-27, -56, 10),
        new p5.Vector(33, -12, 5),
        new p5.Vector(7, 46, 2)
      );
```

Now, before we will be able to actually see our model, we need to specify how these vertices are connected together to form a triangle. Each triangle (or "face") is defined as three integer numbers which are the index of each corner vertex in the `vertices` array. This data structure allows you to re-use the same vertex for multiple faces. One thing to note is that the order in which the vertices are specified can make a difference (this is called "winding order"). The convention in p5.js is to specify the vertices in **clockwise** order as you face the front of the triangle. This is necessary for the `computeNormals()` function to work properly, and even if you're computing normals yourself, it is a good practice to be consistent with this.

```javascript
      // ...

      this.faces.push([0, 1, 2]);
```

Lastly in order for p5.js to cache and reuse the generated WebGL datastructures for this geometry, resulting in a significant performance improvement for complex geometry, it is necessary to give each geometry instance a unique `gid`:

```javascript
      // ...

      // Since this geometry is completely static we can just hard code a unique
      // string.
      this.gid = 'my-example-geometry';
```

Putting that all together we can see our 3D triangle!

<iframe src="https://editor.p5js.org/Kumu-Paul/full/_L9RplFUS" width="100%" height="442" allowfullscreen frameborder="0" marginwidth="0" marginheight="0"></iframe>

However, this triangle will not be illuminated correctly if there is a light shining on it. This is because it does not have any vertex normals. A vertex normal is a vector that points in a direction approximately perpendicular to the triangle's surface. For smooth shapes the normal for a given vertex is usually the average of all the normals for triangles touching that point. When calculating the amount of illumination for each point on each triangle the GPU interpolates the normals from one corner of the triangle to the other, resulting in a smooth transition. Alternately, for hard edged shapes it can be preferable to use separate vertices for each triangle so that each vertex can have a normal that matches only one triangle. Thus, each triangle will be uniformly illuminated.

In order to find the normal for a triangle we take the cross product of the vectors from corner 0 to corner 1 and from corner 0 to corner 2 (note this is where clockwise winding order becomes important, because if we used counterclockwise order we would need to reverse the order of the vectors in the cross product operation). For more information on the cross product operation for vectors I recommend reading the wikipedia article, but suffice it to say that when you take the cross product of any two vectors not pointing in the same nor exactly opposite directions the result is a vector that is perpendicular to both of the input vectors.

```javascript
      // ...

      let v0 = new p5.Vector(-27, -56, 10);
      let v1 = new p5.Vector(33, -12, 5);
      let v2 = new p5.Vector(7, 46, 2);
      this.vertices.push(v0, v1, v2);
      let n = p5.Vector.sub(v1, v0).cross(p5.Vector.sub(v2, v0));
      // because all three vertices share the same normal we have to add the
      // same normal three times
      this.vertexNormals.push(n, n, n);
```

In order for the effect to be evident we need to add a directional light:

``` js
let m;
let cam;

function setup() {
  createCanvas(400, 400, WEBGL);
  cam = createCamera();
  m = createModel();
}

function draw() {
  background(100);
  orbitControl(2, 1, 0.05);
  ambientLight(50);
  // Shine a light in the direction the camera is pointing
  directionalLight(
    240, 240, 240,
    cam.centerX - cam.eyeX,
    cam.centerY - cam.eyeY,
    cam.centerZ - cam.eyeZ
  );
  model(m);
}

// ...
```

<iframe src="https://editor.p5js.org/Kumu-Paul/full/H63Vu0R-U" width="100%" height="442" allowfullscreen frameborder="0" marginwidth="0" marginheight="0"></iframe>

Conveniently, `p5.Geometry` actually has a built-in function that takes care of computing normals, including averaging normals from multiple faces sharing a single vertex. So we can simplify this code quite a bit:

``` js
      // ...
      this.vertices.push(
        new p5.Vector(-27, -56, 10),
        new p5.Vector(33, -12, 5),
        new p5.Vector(7, 46, 2)
      );
      
      this.faces.push([0, 1, 2]);
      
      // Call this once, after all vertices and faces have been initialized
      this.computeNormals();
```

The last thing our geometry needs is support for textures. In order to map regions of a texture image to the surface of our triangle, we need to specify where on the rectangular image each of our vertices lies. As with vertex normals, we need to specify one texture coordinate per vertex, which means if a vertex is shared by multiple faces it will have the same texture coordinate for all of those faces. Given the arbitrary nature of the triangle in question, we can just interpolate based on the x and y coordinates. Texture coordinates range from `[0, 0]` to `[1, 1]` from the top left of the texture to the bottom right.

``` js
      // ...
      this.uvs.push([0.28, 0]);
      this.uvs.push([0.87, 0.43]);
      this.uvs.push([0.62, 1.0]);
```

In order to demonstrate texturing we need to load an image and set the texture before drawing the geometry:

``` js
let img;

function preload() {
  img = loadImage('texture.jpg');
}

// ...

function draw() {
  // ...
  
  texture(img);
  model(m);
}
```

<iframe src="https://editor.p5js.org/Kumu-Paul/full/OMaLNd2mx" width="100%" height="442" allowfullscreen frameborder="0" marginwidth="0" marginheight="0"></iframe>

### Procedural Geometry Example

The previous example was an arbitrarily simplistic case (a single triangle of all things). Next, we will look at an example that is configurable and utilizes `detailX` and `detailY`. To that end, let's create a procedural [Möbius strip](https://en.wikipedia.org/wiki/Möbius_strip) geometry. The function to create a Möbius strip might look like this:

``` js
// createMobius([radius], [stripWidth], [detailX], [detailY])
function createMobius(radius = 40, stripWidth = 20, detailX = 48, detailY = 2) {
  // ...
}
```

The meaning of each of these arguments would be as follows:

| Parameter | Description |
| --------- | ----------- |
| `radius` | The distance from the center of the geometry to the strip. |
| `stripWidth` | The width of the strip itself. |
| `detailX` | The number of columns of triangles along the length of the strip. |
| `detailY` | The number of rows of triangles across the width of the strip. |

Now, the trigonometry to calculate the vertices for a Möbius strip is a bit complicated and beyond the scope of this article. However, the important thing is that `detailX` and `detailY` dictate the number of vertices, and the vertices must be arranged in a particular order. Namely, there should be `detailY + 1` rows of vertices, all the vertices for each row should be added consecutively, and the number of vertices within each row should be `detailX + 1`. When the vertices are arranged in this way based on `detailX` and `detailY`, there is no need to manually populate the `faces` array. Instead, the built-in `computeFaces()` function can be used.

``` js
const spread = 0.1;

// createMobius([radius], [stripWidth], [detailX], [detailY])
function createMobius(radius = 40, stripWidth = 20, detailX = 48, detailY = 2) {
  return new p5.Geometry(
    detailX,
    detailY,
    // This needs to be an anonymous function not an arrow expression in order
    // for the binding of "this" to be correct
    function() {
      // create strips of vertices
      
      // the strip actually makes two revolutions, once for triangles facing
      // out, and one for triangles facing in.
      const angle = 4 * PI / detailX;
      const offset = -stripWidth / 2;
      const interval = stripWidth / detailY;
      
      // for each row
      for (let j = 0; j <= detailY; j++) {
        // for each column
        for (let i = 0; i <= detailX; i++) {
          let u = i * angle;
          let v = offset + interval * j;
          
          let x = (radius + v * Math.cos(0.5 * u)) * Math.cos(u) - Math.sin(u / 2) * 2 * spread;
          let y = (radius + v * Math.cos(0.5 * u)) * Math.sin(u);
          if (u < TWO_PI) {
            y += Math.sin(u) * spread;
          } else {
            y -= Math.sin(u) * spread;
          }
          
          let z = v * Math.sin(0.5 * u) + Math.sin(u / 4) * 4 * spread;
          
          this.vertices.push(new p5.Vector(x, y, z));
        }
      }
      
      // Because our geometry is made up of strips of vertices based on detailX
      // and detailY we can use computeFaces, but in order for this to work it
      // is important that the number of vertices per strip be equal to
      // detailX + 1 and the number of strips be equal to detailY + 1.
      this.computeFaces();
      this.computeNormals();
      
      this.gid = `mobius|${radius}|${stripWidth}|${detailX}|${detailY}`;
    }
  );
}
```

Note how the `gid` value in this case incorporates all the parameters that determine the precise set of vertices. This is so that multiple Möbius strips can be created with different parameters and each one will have its own set of cached geometry data. However, if two Möbius strips with exactly the same parameters are created, or the same strip is drawn repeatedly, there will be no need to regenerate the WebGL data structures. This is take care of behind the scenes by the `model()` function.

<iframe src="https://editor.p5js.org/Kumu-Paul/full/AnHr8yL2a" width="100%" height="442" allowfullscreen frameborder="0" marginwidth="0" marginheight="0"></iframe>

## Conclusion

There are numerous scenarios where creating custom `p5.Geometry` might be useful, and it has **significantly** better performance than drawing triangles using `beginShape()`/`endShape()` or using large numbers of primitives. I hope this article has demystified how `p5.Geometry` works and will enable you to make better, faster 3D graphics with p5.js.

A hui hou 🤙

<iframe src="https://editor.p5js.org/Kumu-Paul/full/W3YM4J-eW" width="100%" height="442" allowfullscreen frameborder="0" marginwidth="0" marginheight="0"></iframe>
