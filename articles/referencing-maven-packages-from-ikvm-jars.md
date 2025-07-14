/*---
layout: article.hbs
tags: articles
subtitle: Referencing Maven Packages as Transitive Dependencies For IKVM Jar References
date: 2025-07-13 00:00:00-10
description: IKVM is a project that makes it possible to reference Java jars and packages from .Net projects, but things get complicated when you reference local jar files with transitive dependencies on Maven packages.
---*/

File this under the most bespoke problems in software engineers but just in case there's somebody else out there doing this, here we go...

## Background

[IKVM](https://github.com/ikvmnet/ikvm) is a really great, seemingly underappreciated, library that makes it possible to reference Java packages from .Net projects.
Given the vast number of Java packages out there this is potentially really powerful for those developers who prefer to code in .Net targeted languages like C#.
When you reference a java package from there are two possible approaches: reference it directly as either a jar or java source files using [`IkvmReference`](https://github.com/ikvmnet/ikvm?tab=readme-ov-file#example), or you could leverage [`IKVM.Maven.Sdk`](https://github.com/ikvmnet/ikvm-maven?tab=readme-ov-file#ikvmmavensdk---ikvm-support-for-maven-dependencies) to reference it as a Maven package via `MavenReference`, assuming it is deployed to a Maven repository.
One key difference between these two approaches is how they deal with transitive dependencies.
With `MavenReference` transitive dependencies are automatically included, but with `IkvmReference` you are on your own, and you need to include the transitive dependencies in the `References` property of your `IkvmReference` item.
This is straightforward for local jar files that you know the relative path for, but it is a little more tricky when you'd really like to include that transitive dependency as a `MavenReference`.

## IkvmReference to a Local Jar with a Transitive Maven Package Dependency

So, let's say you have a private jar you are building locally but that package depends on a 3rd party package from Maven Central (`log4j` for instance).
One solution would be to set up a private Maven repository and reference it that way, and that honestly might be the best solution, but for the sake of argument we will assume that you don't want to do that.
In order for classes in your IkvmReferenced jar to be able to load their dependencies from `log4j` the `IkvmReference` entry in your project file will need to list that maven package in its `<References>` child element, and it will need to do so using a specialized format: `maven$orgid:artifactid:version`.
Here is an example:

```xml

<!-- given the following MavenReference -->
<MavenReference Include="log4j:log4j" Version="1.2.17" />

<!-- the IkvmReference for a local jar that depends on log4j would look like this: -->
<IkvmReference Include="your-library.jar">
  <AssemblyName>YourLibrary</AssemblyName>
  <AssemblyVersion>1.0.0</AssemblyVersion>
  <AssemblyFileVersion>1.0.0</AssemblyFileVersion>
  <References>maven$log4j:log4j:1.2.17</References>
</IkvmReference>
```

## Looking Up the Actual Item Spec

So far it seems to be as straightforward as that.
However, it is possible that the format of the reference string won't always be precisely that format in all cases.
If you run into a build error like this: `IkvmTaskMessageException: IKVMSDK0006: The IkvmReference your-library.jar contains an invalid Reference 'maven$orgid:artifactid:version'` then you may need to look at the detailed build output for the `MavenReference` to make sure the id is correct.
Doing so requires the following steps

### Prerequisite

[StructuredLogViewer](https://www.msbuildlog.com/)

### 1. Produce a Build with Diagnostic Logging

First, comment out any broken `<References>` entries that are causing your build to fail.
In JetBrains Rider this is an option under Build > Advanced Build Options, other IDEs will likely include this option somewhere, but you can always use the `dotnet build` command:

```shell
dotnet build -bl
```

This should produce a `.binlog` file in your working directory (if you generate it with your IDE the file will be in an IDE specific location)

### 2. Use StructuredLogViewer To Find the IkvmReference spec generator for your Maven package

* Open your `.binlog` file in StructuredLogViewer.
* Search for `_GetMavenIkvmReferenceItems`
* Find the `Add Item IkvmReferenceItem` child for your Maven package nested under the `_GetMavenIkvmReferenceItems` Target
* Right-click on the appropriate `Add Item` entry and select `Copy`

Use that string in your `<References>`

## Conclusion

🍻 That's it, hope this helps.

I would also like the express my appreciation to the creators and maintainers of the IKVM project and encourage any readers to [support them on GitHub](https://github.com/sponsors/wasabii)!

## License

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /> </a> © 2025 Paul Wheeler, made available under the <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
