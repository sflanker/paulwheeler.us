module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("images");

  eleventyConfig.addHandlebarsHelper(
    "traverse",
    function (context, options) {
      let key = options.hash["children"];
      if (context) {
        let rendered = "";
        let queue = context instanceof Array ? context.slice() : [context];

        while (queue.length) {
          let next = queue.shift();
          rendered += options.fn(next);

          if (next[key] instanceof Array) {
            queue = next[key].concat(queue);
          }
        }

        return rendered;
      }
    }
  );

  return {
    templateFormats: [
      "mustache",
      "hbs",
      "scss"
    ],
    passthroughFileCopy: true
  };
};
