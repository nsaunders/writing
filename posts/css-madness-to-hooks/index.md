---
title: From CSS madness to CSS Hooks
description:
  The limited capabilities of inline styles have frustrated web developers for
  decades, forcing us to choose between unmaintainable architecture and complex
  workarounds. CSS Variables offer a solution.
published: 2023-10-17T12:00:00.000Z
tags:
  - CSS
  - React
---

In the component era, the close relationship between HTML and CSS demands—from a
maintainability perspective at least—colocation. Some people still believe in a
"separation of concerns"; but, as a pragmatist, I only see a technical boundary.
One that I, like many (most?) other React developers, would prefer didn't exist.

The most basic way to colocate HTML and CSS is rooted in the HTML standard
itself in the form of the
[`style` attribute](https://html.spec.whatwg.org/multipage/dom.html#the-style-attribute).
Web frameworks universally support the `style` attribute, and React even
provides an additional layer of "syntactic sugar" convenience known as
[style objects](https://react.dev/learn/javascript-in-jsx-with-curly-braces#using-double-curlies-css-and-other-objects-in-jsx).
In short, the `style` attribute, often referred to as _inline styles_, "just
works". Natively.

Unfortunately, some inherent "feature gaps" have made inline styles unsuitable
for most real-world use cases. Something as trivial as a
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
toward heavy-handed workarounds like CSS-in-JS, atomic CSS, and "zero-runtime"
solutions (each one making different tradeoffs but accepting some form of
significant complexity nevertheless). _CSS madness._

Personally, I've engaged in CSS madness for several years, even creating a few
workarounds of my own. But a recent discovery has dramatically changed the
situation for me.

CSS Variables are programmable.

## The fallback trick

The `var()` function, used to access the value of a variable, allows you to
provide a fallback value to use in case that variable isn't set. For example,
`var(--error-color, red)` represents the value of `--error-color`, if set, or
otherwise the fallback value of `red`.

The programmability I mentioned is built upon this simple fallback mechanism.

When the variable is set to `initial`, the fallback value is used instead.

When the variable is set to an empty value, the empty value is used rather than
the fallback value. The empty value has no effect on the declaration.

Thus, a pair of variables can be used to toggle between arbitrary fallback
values depending on some condition, like a matching selector or at-rule.

Armed with this knowledge, you can do the unthinkable—implement a hover effect
within an inline style:

```html
<a href style="color: var(--hover-on, #18659f) var(--hover-off, #003665)">
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

[Live demo](https://htmlpreview.github.io/?https://github.com/nsaunders/writing/blob/master/posts/css-madness-to-hooks/demo.html)

As you can see, the mechanism is simple, but the syntax leaves much to be
desired:

1. It is difficult to parse the value of the `color` declaration at a glance.

2. Combining multiple "state variables" requires nesting, which is tedious and
   difficult to read. For example, activating a hover effect only when the
   element is enabled looks something like this:

```
color: var(--enabled-on, var(--hover-on, #18659f) var(--hover-off, #003665)) var(--enabled-off, gray);
```

Moreover, the supporting style sheet, while compact and highly reusable, is
still just boilerplate that I'm sure you'd rather not have to maintain.

But don't worry—I can offer a solution that addresses all of these points,
helping to make this approach not only simple, but convenient.

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
but the possibilities include the full range of pseudo-classes, media queries,
container queries, and even custom selectors.

### Usage

Anywhere you find a style object that you'd like to enhance with hooks, you can
simply "wrap" it in a call to the `hooks` function:

```tsx
function Button(props: Props) {
  return (
    <button
      {...props}
      style={hooks({
        border: 0,
        margin: 0,
        padding: "0.75rem 1rem",
        fontFamily: "sans-serif",
        fontSize: "1rem",
        background: "#333",
        color: "#fff",
        borderRadius: "0.5rem",
      })}
    />
  );
}
```

From there, it's possible to use the hooks via nested style objects. For
example, you might want to apply some declarations when the `hover` or
`disabled` hooks are activated:

```tsx
function Button(props: Props) {
  return (
    <button
      {...props}
      style={hooks({
        border: 0,
        margin: 0,
        padding: "0.75rem 1rem",
        fontFamily: "sans-serif",
        fontSize: "1rem",
        background: "#333",
        color: "#fff",
        borderRadius: "0.5rem",
        hover: {
          color: "#666",
        },
        disabled: {
          color: "#999",
          cursor: "not-allowed",
        },
      })}
    />
  );
}
```

Using the variable fallback trick, the `hooks` function flattens the style
object, reducing it to a form that is compatible with the `style` prop.

### Generating CSS

As you saw earlier when I demonstrated the variable fallback trick, it is
supported by a small static style sheet. The CSS Hooks system takes care of
generating the content of that style sheet for you. All you need to worry about
is adding it to the document, e.g. via a `<style>` element in the root component
of your app.

### Configuration (custom hooks)

CSS Hooks ships with ~30 "recommended" hooks, including the basics like `hover`,
`active`, `focus`, and `disabled`. But you can easily extend or replace them
with your own custom hooks.

This flexibility lets you decide the best way to approach concerns like:

- **Dark mode**. Will you use a `prefers-color-scheme` media query, a `dark`
  class, a combination, or something else?
- **Responsive design**. Are you ready to start using container queries, or do
  you want to stick with media queries?
- **Breakpoints**. Where do you draw the line between desktop and mobile
  devices?

It also helps you address less-common use cases without resorting to external
CSS. For example, in a recent project, I created a hook that is activated when
hovering over the element's previous sibling, and another one that is activated
when pressing down on the previous sibling.

Here's my configuration:

```tsx
const [css, hooks] = createHooks({
  ...recommended,

  previousHover: ":hover + &",
  previousActive: ":active + &",

  dark: "@media (prefers-color-scheme: dark)",
  mobile: "@media (max-width: 499px)",
  desktop: "@media (min-width: 500px)",
});
```

## Next steps

If CSS Hooks seems interesting, please go to
[css-hooks.com](https://css-hooks.com) for more information, including a
complete guide to getting started.

But before you click away, I would like to ask you for two favors:

1. As a brand-new project, CSS Hooks has very limited exposure. Would you please
   consider [adding a star](https://github.com/css-hooks/css-hooks) on GitHub to
   help others find it?
2. If you can offer any feedback or have ideas for additional framework
   integrations, please
   [start a discussion](https://github.com/css-hooks/css-hooks/discussions).

Thanks in advance for your help.

## Wrapping up

As HTML templating and component-oriented architecture have gained traction over
the years—making traditional CSS architecture mostly redundant—the lack of
native browser support for inline style rules created a vacuum that many
talented developers have rightly attempted to fill. Each solution has had some
merit and been "good enough" under the right conditions. Perhaps that is why we
were too comfortable with our workarounds to notice when CSS Variables quietly
brought us a native solution.

At the same time, I don't want to suggest that CSS Hooks is a cure for CSS
madness, except perhaps in relative terms. This solution is extremely flexible,
but it still requires you to make some decisions upfront (which hooks will you
need). This solution is entirely focused on React and JSX frameworks, but I
would like all web developers to have a simple styling solution regardless of
their framework choices. It is a highly effective treatment, but a step short of
a cure.

The real cure would be explicit browser support for nested rulesets in inline
styles, like we were supposed to have 20 years ago. Rumor has it,
[this might be on the way](https://twitter.com/LeaVerou/status/1665413012323270659).
And whenever it lands, I hope React's `style` prop API will be updated
accordingly.

In the meantime, CSS Hooks gets me about 95% of the way there; and, after
experiencing the alternatives, I am pretty happy with that (for now). I hope
that Hooks will make your life easier, too.
