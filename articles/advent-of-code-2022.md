/*---
layout: article.hbs
tags: articles
subtitle: Advent of Code Journal 2022
date: 2022-12-05 00:00:00-10
description: A journal of my thoughts solving the 2022 Advent of Code puzzles with 25 different programming languages.
---*/

# Introduction

I have been aware of the Advent of Code for many years but hadn't opted to take part until this year. Having spent most of my life writing code professionally, I have both achieved proficiency in many programming languages, and am not presently driven to learn any one particular programming language. So, to keep things interesting I decided to solve each of the 25 advent of code puzzles this year using a different programming language.

I decided to select 25 language at random and use them in a random order. My reasoning was to avoid biasing towards languages I already knew, and to try out languages in situations where they might prove to be a little out of their element. This is neither a particularly good way to learn a new language, or to evaluate one objectively, but it was good fun nonetheless. The one constraint I did apply to my language select was that it had to have an official template on [Replit.com](https://replit.com/).

## Replit.com

One common nuisance associated with using a new programming language is installing the tools, configuring editors, and so on. Leveraging Docker can alleviate some of this inconvenience but involves additional setup and doesn't lead to an ideal development environment (every code change might require a container rebuild, harder to support hot-reload style development, REPL interfaces may not work as well).

[Replit.com](https://replit.com/) is one way to solve many of these issues, and when startup speed is essential (as it is when you're trying to use a new programming language every day for 25 days straight), it is a massive help.

Replit.com is a web based development environment with a browser based text editor that has syntax highlighting, Vim and Emacs keybindings, and in some cases tab completion and other language intelligence features. Each Replit.com project is backed by a container that can be configured with packages using [NixOS](https://nixos.org/) configuration. You get access to a shell running in the container, and can launch your program simply by hitting the Run button. Exactly how the Run button works varies by programming language and can be configured to your requirements. As a matter of fact I'm writing this article right now using a Replit project.

### Notable Replit Features

 * Vim and Emacs Keybindings
 * Language aware intelligence
   * syntax coloring
   * auto-indent
   * error detection/highlighting
   * auto-complete
   * suggestions/automatic refactoring
   * note: advanced features are limited to certain languages
 * Built-in version control with git including GitHub integration
 * Persistent edit history allowing you to rewind changes in-between commits
 * Built-in package manager (for some programming languages)
 * Environment secrets for passwords an API keys that you wouldn't want to share publicly
 * Key-Value data storage via a REST API
 * Free static content hosting
 * Free on-demand serverless application hosting
 * Live multi-player code editing
   * Chat with other editors in multi-player REPL
   * Threads (comments) that can be posted within code files

There are however some gotchas and limitations that come along with utilizing Replit.com. I will enumerate a few of those, and the workarounds I came up with, in the sections ahead.

## A Note About My Approach

As I tackled each puzzle, I made an effort to learn a little about what an idiomatic approach would be in the particular language I was using. However, I often fell short in this regard and much of the code that I wrote is probably not particularly admirable.

When I started each puzzle the first thing I did was write the code to download the puzzle input. This gave me a nice repetitive task to get my feet wet with each new language. It also forced be to get familiar with the package management or library systems for many languages which did not have a built in HTTPS client (in some cases this was more of a time sink than the puzzle itself).

In order to fetch the puzzle input you need the `session` that is generated when you login to adventofcode.com. The value for cookie must be stored in the `session_id` environment variable for the code. If you are running my code on Replit.com I recommend you create this environment variable using the "Secrets" tool in the UI. You can obtain your session token by logging in to adventofcode.com, opening your browser's developer tools, navigating to the tab that lets you view application data, find the cookies section, select the entry for `session` and copy the value.

# Journal

## Day 1. [Elixir](https://elixir-lang.org/)

[Day 1 Puzzle](https://adventofcode.com/2022/day/1)

[My Solution](https://replit.com/@KumuPaul/AoC-2022-Day01#main.exs)

**Level of Experience:** _None_  
**Puzzle Difficulty:** _Easy_

The day one puzzle was a straightforward process of splitting the input into groups, summing the numbers in each group, and selecting to largest value or values.

Fetching the input was relatively easy in Elixir. Since Elixir is based on Erlang it is possible to use modules that are included with Erlang. Conveniently Erlang includes [httpc](https://www.erlang.org/doc/man/httpc.html), which in conjunction with [ssl](https://www.erlang.org/doc/man/ssl.html), can be used to make basic HTTPS requests. This allowed me to proceed without figuring out how to install and use a third party package.

I did make things a little difficult for myself by doing my best to keep my implementation streaming, so that it could process arbitrarily large input with minimal memory footprint. Unfortunately, as far as a know the `httpc.request` may buffer the entire response body, so the streaming bit could be for naught. A significant amount of effort went into creating a lazy stream of lines from the `charlist` returned by `httpc.request`. Once that was done, the summing and finding the top values was easy.

For me Elixir came naturally thanks to my experience with Haskell and Clojure. I felt right at home with the Enum module, writing pattern matching functions, and chaining functions with the `|>` (pipe) operator.

### Replit Support: Moderate

Replit has moderate support for Elixir. It is nice that the run button drops you into an interactive REPL after executing your code. Unfortunately there is no built in package management support (it looks like this could be a thing via [mix](https://hexdocs.pm/mix/Mix.html#module-dependencies)). Additionally, beyond simple syntax coloring, there is no advanced language support (auto-complete, error checking, etc.)

## Day 2. [Node.js](https://nodejs.org/en/about/)

[Day 2 Puzzle](https://adventofcode.com/2022/day/2)

[My Solution](https://replit.com/@KumuPaul/AoC-2022-Day02#index.js)

**Level of Experience:** _Expert_  
**Puzzle Difficulty:** _Easy_

Day two started out as a easy implementation of rock-paper-scissors, simply determining the outcome of a series of matches. The part two curve-ball only made things nominally more complex, requiring you to determine the necessary move to achieve a desired outcome against a known opponents play.

Fetching the input in Node.js is quite trivial. I opted to use `node-fetch` because prior to the Fetch API being available, Node's built in HTTPS capabilities are quite unpleasant to use. Fortunately package management in Node.js is a piece of cake and natively supported by Replit. I did make a tweak to the default `package.json` file setting `type` to `module` so I could use ES6 style `import` statements rather than the Node.js style `require`.

To keep things interesting I came up with what I thought was a neat way to use numeric representations for the different moves in rock-paper-scissors, and the came up with modulo arithmetic to calculate the outcome and pick a move to achieve the desired outcome.

After the fact I decided to see how compact I could make this solution by hand minification. The result is 9 lines and fewer than 600 characters:

```javascript
import fetch, { Headers } from 'node-fetch'
let [k,h,gc,s,t,l,p1,p2]=[{A:0,B:1,C:2,X:0,Y:1,Z:2},new Headers({'Cookie': `session=${process.env['s']}`}),m => (r => ({X:(m+2),Y:m,Z:(m+1)})[r]%3),(o, c) => ([3,6,0])[(3+c-o)%3]+c+1,a=>a.reduce((x,y)=>x+y)]
fetch('https://adventofcode.com/2022/day/2/input', { headers: h }).then(r => r.text()).then(i => {
  l = i.split('\n').filter(v => v != '').map(v => v.split(' '))
  p1 = t(l.map(([o, m]) => s(k[o], k[m])))
  console.log(`Part 1. ${p1}`)
  p2 = t(l.map(([o, r]) => s(k[o], gc(k[o])(r))))
  console.log(`Part 2. ${p2}`)
})
```

### Replit Support: Excellent

Unsurprisingly NodeJS has great support on Replit. Notably: built in package management, error highlighting, auto-complete, documentation, etc. all work.

## Day 3. [Haskell](https://www.haskell.org/)

[Day 3 Puzzle](https://adventofcode.com/2022/day/3)

[My Solution]()

**Level of Experience:** _Intermediate_  
**Puzzle Difficulty:** _Easy_

They day three puzzle involves finding characters that exist in both the first and second half of a string with an even number of characters. By leveraging the built in set data structures this is quite trivial in Haskell. I made up for the simplicity by scratching a few itches:

1. I had become so used to the intuitive structure of functions chained with the pipe operator in Elixir that I wanted to have the same structure in my Haskell code. To this end I discovered the [`&`](https://hackage.haskell.org/package/base-4.17.0.0/docs/Data-Function.html#v:-38-) and [`<&>`](https://hackage.haskell.org/package/base-4.17.0.0/docs/Data-Functor.html#v:-60--38--62-) operators for pure and monadic functions respectively, which I did not recall using much when I wrote Haskell in he past.
2. I found a nice [library for doing string interpolation](https://github.com/sol/interpolate#readme). Which allows you to write srings with interpolated code segments like `[i|Hello #{Name}!|]` instead of using string concatenation or formatting.
3. I was reminded of how great [Hoogle](https://hoogle.haskell.org/) is once you understand Haskell's type system. For the unintiated, Hoogle lets you search for function documentation in both base and third party packages based on type signature.

### Replit Support: Good

Auto-complete is limited by error highlight and suggestions are great. There's no built in package management (even in the [Cabal](https://www.haskell.org/cabal/) template). Fortunately many packages can be installed via the NixOS package `ghcWithPackages`.

## Day 4. [Scala](https://www.scala-lang.org/)

[Day 4 Puzzle](https://adventofcode.com/2022/day/4)

[My Solution]()

**Level of Experience:** _Intermediate_  
**Puzzle Difficulty:** _Easy_

TODO

### Replit Support: Moderate

No package support. No autocomplete. Mouse over documentation and code suggestions do work.

I ran into some issues because I wanted to use JDK 11 features and by default the Scala template on Replit uses an older version of the JDK it took some doing to figure out how to get the Scala NixOS package to use a different version of the JDK:

```
{ pkgs }: {
    deps = [
        pkgs.jdk11
        (pkgs.scala.override {
          jre = pkgs.jdk11;
        })
        pkgs.metals
    ];
}
```

The default Scala template does not keep an interactive REPL open after the code is run. The `scala` cli can load code in interactive mode but by default it will not invoke the main function. I worked around this by modifying the `.replit` configuration to generate s Scala file that adds a call to the main function to the end of the normal code file.

The customized bit of `.replit` file:

```
compile = ["./.prepare.sh"]
run = ["scala", "-i", ".tmp/main.scala"]
```

My `.prepare.sh` script:

```
#! /usr/bin/env sh

cp main.scala .tmp/
echo "" >> .tmp/main.scala
echo "Main.main(new Array[String](0))" >> .tmp/main.scala
```

## Day 5. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day 5. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

### Replit Support: _

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_

## Day _. [_]()

[Day _ Puzzle]()

[My Solution]()

**Level of Experience:** _?_  
**Puzzle Difficulty:** _?_