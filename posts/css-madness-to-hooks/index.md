---
title: From CSS madness to CSS Hooks
description:
  The limited capabilities of inline styles have frustrated web developers for
  decades, forcing us to choose between unmaintainable architecture and complex
  workarounds. CSS Variables offer a solution.
image_src: assets/images/cover.webp
image_alt: A 19th-century inventor standing next to a Rube Goldberg machine
published: 2023-10-17T12:00:00.000Z
updated: 2025-01-17T12:00:00.000Z
tags:
  - CSS
  - React
---

In the component era, the close relationship between HTML and CSS demands
colocation. Some people still cling to the idea of a "separation of concerns";
but, as a pragmatist, I only see a technical boundary. One that I, like many
(most?) other React developers, would prefer didn't exist.

The most basic way to colocate HTML and CSS is rooted in the HTML standard
itself in the form of the
[`style` attribute](https://html.spec.whatwg.org/multipage/dom.html#the-style-attribute).
Web frameworks universally support the `style` attribute, and React even
provides an additional layer of syntactic sugar convenience known as
[style objects](https://react.dev/learn/javascript-in-jsx-with-curly-braces#using-double-curlies-css-and-other-objects-in-jsx).
In short, the `style` attribute, aka inline styles, "just works". Natively.

Unfortunately, some inherent feature gaps have made inline styles unsuitable for
most real-world use cases. Something as trivial as a
[hover effect](https://stackoverflow.com/questions/131653/inline-style-to-act-as-hover-in-css)
can't be done with inline styles because they lack
[pseudo-classes](https://www.w3.org/TR/selectors-4/#pseudo-classes). Responsive
design is out of the question because they don't have
[media](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries) or
[container](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
queries. At some point, inline styles
[were supposed to do more](https://www.w3.org/TR/2002/WD-css-style-attr-20020515#examples);
but, tragically, the browser vendors never delivered.

Today, the simplicity of inline styles is easily outweighed by their
limitations, a situation that has fueled much resentment and pushed developers
toward clumsy workarounds like CSS-in-JS, atomic CSS, and "zero-runtime"
solutions, each one making different tradeoffs but accepting some form of
significant complexity nevertheless (in addition to the
[perils of the cascade](../cascade-perils)). _CSS madness._

Personally, I've engaged in CSS madness for several years, even creating a few
workarounds of my own. But a recent discovery has dramatically changed the
situation for me.

CSS Variables are programmable.

## The fallback trick

The CSS `var` function, used to access the value of a variable, allows you to
provide a fallback value to use in case that variable isn't set. For example,
`var(--error-color, red)` represents the value of `--error-color`, if set, or
otherwise the fallback value of `red`.

Believe it or not, the programmability I mentioned is built upon this simple
fallback mechanism.

When the variable is set to `initial`, the fallback value is used instead
because `initial` is considered a _guaranteed invalid_ value,

When the variable is set to an empty value, the empty value is used rather than
the fallback value. The empty value has no effect on the declaration, just as
concatenating an empty string would leave the original string unchanged.

Thus, a pair of variables can be used with these special values to toggle
between arbitrary fallback values depending on some condition, like a matching
selector or at-rule.

Armed with this knowledge, you can do the unthinkable—implement a hover effect
within an inline style:

```html
<a href style="color: var(--hover-on, #f00) var(--hover-off, #00f)">
  Hover me
</a>
<style>
  * {
    --hover-off: initial;
    --hover-on: ;
  }
  :hover {
    --hover-off: ;
    --hover-on: initial;
  }
</style>
```

[Live demo](https://htmlpreview.github.io/?https://github.com/nsaunders/writing/blob/master/posts/css-madness-to-hooks/assets/demo.html)

As you can see, the mechanism is simple, but the syntax leaves much to be
desired:

1. It is difficult to parse the value of the `color` declaration at a glance.

2. Combining multiple state variables requires nesting, which is tedious and
   difficult to read. For example, activating a hover effect only when the
   element is enabled looks something like this:

<!--prettier-ignore-start-->
```css
color: var(--enabled-on, var(--hover-on, #18659f) var(--hover-off, #003665)) var(--enabled-off, gray);
```
<!--prettier-ignore-end-->

Moreover, the supporting style sheet, while compact and highly reusable, is
still just boilerplate that I'm sure you'd rather not have to maintain.

But don't worry—I can offer a solution that addresses these issues, helping to
make this approach not only simple, but convenient.

## Hooks (not the React kind)

When I found the variable fallback trick, I was very excited about its potential
as a solution to CSS madness. But it was also clear that the syntax was a big
problem. Some kind of abstraction would still be needed; but at least now it
could map cleanly to a simple underlying reality, rather than simply hiding
complexity.

So, I set about building CSS Hooks, aiming to fill the feature gaps of the
`style` prop to complete its otherwise unrivaled developer experience.

A _hook_ allows you to tap into a CSS feature that is normally inaccessible
within inline styles. The canonical first example is the `:hover` pseudo-class;
but the possibilities include the full range of pseudo-classes; media,
container, and feature queries; and even custom selectors.

### How it works

#### Creating hooks

The first step is to create the hooks you'll use when building your components.

```typescript
// src/css.ts

import { createHooks } from "@css-hooks/react";

const { on, and, or, not, styleSheet } = createHooks(
  "&:hover",
  "&:focus-visible",
  "&:disabled"
);
```

#### Adding the style sheet

As you saw earlier when I demonstrated the variable fallback trick, it's
supported by a minimal style sheet. The `styleSheet` function returned above
generates the content of that style sheet for you based on the configured hooks.
All you need to worry about is adding it to the document, e.g. via a `<style>`
element at the entry point of your app:

```tsx
// src/main.tsx

import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { styleSheet } from "./css.ts";

createRoot(document.getElementById("root")!).render(
  <>
    <style dangerouslySetInnerHTML={{ __html: styleSheet() }} />
    <App />
  </>
);
```

#### Using the hooks

Now you're ready to use the hooks. For example, the `&:hover` and `&:disabled`
hooks configured earlier can be used to apply their respective styles
conditionally:

```tsx
// src/button.tsx

import type { ComponentProps } from "react";
import { pipe } from "remeda";
import { on } from "./css.ts";

export function Button(props: Omit<ComponentProps<"button">, "style">) {
  return (
    <button
      style={pipe(
        {
          background: "#333",
          color: "#fff"
        },
        on("&:hover", {
          background: "#666"
        }),
        on("&:disabled", {
          background: "#333",
          cursor: "not-allowed"
        })
      )}
      {...props}
    />
  );
}
```

Note that the `pipe` function is a generic solution for function composition. If
you're interested to learn more about how it works, Nick Scialli provides an
excellent overview in his post
[How to Use Pipe in JavaScript](https://typeofnan.dev/how-to-use-pipe-the-pipeline-operator-in-javascript/).

Meanwhile, the `on` function merges each successive ruleset (style object) with
the previous one. Each ruleset's values are applied conditionally using the
variable fallback trick, with the preceding ruleset providing the fallback
values. The end result is a flat style object that is compatible with the
`style` prop.

You can also use the `and`, `or`, and `not` functions to create complex
conditions by combining hooks using boolean logic. For example, you can apply a
background color on hover or focus, only when the button is not disabled:

```tsx
// src/button.tsx

import type { ComponentProps } from "react";
import { pipe } from "remeda";
import { on, and, or, not } from "./css.ts";

export function Button(props: Omit<ComponentProps<"button">, "style">) {
  return (
    <button
      style={pipe(
        {
          background: "#333",
          color: "#fff"
        },
        on(and(or("&:hover", "&:focus-visible"), not("&:disabled")), {
          background: "#666"
        }),
        on("&:disabled", {
          cursor: "not-allowed"
        })
      )}
      {...props}
    />
  );
}
```

This ability to combine hooks allows you to create simple, generic hooks that
you can reuse across a wide range of use cases.

## Next steps

If CSS Hooks seems interesting, please go to
[css-hooks.com](https://css-hooks.com) for more information, including a
complete guide to getting started.

But before you click away, I would like to ask you for two favors:

1. As a new project, CSS Hooks has very limited exposure. Would you please
   consider [adding a star](https://github.com/css-hooks/css-hooks) on GitHub to
   help others find it?
2. If you can offer any feedback or have ideas for additional framework
   integrations, please
   [start a discussion](https://github.com/css-hooks/css-hooks/discussions).

Thanks in advance for your help.

## Wrapping up

The rise of component architecture has driven an eager search for styling
solutions that can easily be embedded in (or at least colocated with) markup,
Many interesting solutions have emerged approximating inline styles. They have
seen huge adoption for good reason. Combined with widely-held technical
assumptions, they have made it easy for the community to forget about inline
styles and overlook the potential of the variable fallback trick.

But now that we know how to extend the capabilities of inline styles, it's
important to recognize when an alternative is really just a heavy-handed
workaround founded on outdated assumptions. Building browser-based apps is
complicated enough without having to battle cascade defects, learn proprietary
styling syntax, configure extra CSS build steps, etc.

By enhancing inline styles rather than replacing them with an entirely different
system, CSS Hooks aims to be less of a workaround and more of a
[bridge to the future](https://x.com/markdalgleish/status/1732224401553432900).
