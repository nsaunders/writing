---
title: Function asChild
description:
  How I use a classic React design pattern to build polymorphic components
  safely
published: 2023-06-19
tags:
  - TypeScript
  - React
---

> _Everything should be made as simple as possible, but not simpler._<br/>
> —Albert Einstein

As a design system engineer, my primary goal is to deliver a consistent user
experience across a large number of products. Succeeding in this requires
consistent reuse of the components I build. Consistent reuse of these components
requires them to adapt to a wide range of use cases. Otherwise, my clients will
opt out and roll their own components, typically losing important functionality
or design details in the process.

My most essential technical tool for delivering the required flexibility is the
notion of the _polymorphic component_. Before jumping into code, allow me to
explain this important concept and why it's so useful.

## What are polymorphic components?

A polymorphic component delivers consistent visual design and functionality in a
context-sensitive manner as follows:

1. It offers direct control over the rendered markup, allowing developers to
   [improve accessibility via semantic HTML](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML).

1. Its appearance and/or behavior can be combined with those of another
   component.

A `Button` component is the canonical example of component polymorphism: By
default, it just renders a HTML `<button>` element with some fancy styling, but
it can be configured to render an `<a>` element instead (like when a screen
reader should announce it as a link).

Aside from custom HTML tags, a `Button` might be combined with e.g. a `Link`
component from a routing framework like
[React Router](https://reactrouter.com/en/main/components/link) or
[Next.js](https://nextjs.org/docs/pages/api-reference/components/link)—bringing
the visual design of `Button` and the functionality of `Link` together into a
single element.

In short, the flexible nature of polymorphic components allows a single
implementation to serve a wider range of use cases. This promotes reuse of UI
elements, improving code maintainability while delivering a more cohesive user
experience.

## Current approaches

Over the past few years, two approaches for achieving polymorphic components
have been widely circulated and discussed within the React community: the `as`
prop and the `asChild` prop. Before reinventing the wheel, let's take a look at
these.

### The `as` prop

The `as` prop emerged starting around 2018 in popular libraries such as
[Styled Components](https://styled-components.com/docs/api#as-polymorphic-prop),
[Material UI](https://mui.com/material-ui/api/button/#props) (under the
`component` prop name), and
[Chakra UI](https://chakra-ui.com/community/recipes/as-prop). Using the `as`
prop, the button-as-link use case described above would be implemented something
like this:

```tsx
<Button as="a" href="https://react.dev">
  Get started
</Button>
```

For TypeScript users, the `as` prop can be especially interesting because a
typical type definition will guard against invalid prop combinations depending
on the value of the `as` prop. For example, this would not compile since `href`
is not a valid HTML `<button>` attribute:

```tsx
<Button as="button" href="https://react.dev">
  Get started
</Button>
```

A couple of years ago, the `as` prop was practically synonymous with the term
_polymorphic component_, and for good reason. It is widely recognized; it's easy
to use; and it offers a reasonable degree of type safety, which unfortunately is
not true of its "successor" (more on that later). But, to be fair, it's not a
perfect solution.

#### Problems with the `as` prop

Over the last two years, the `as` prop has been challenged as the de-facto
standard for polymorphic components on the following points:

1. Slow TypeScript performance
1. Poor type inference
1. Prop collisions

To be honest, I haven't experienced the first two issues myself; but I _can_
relate to the third issue, and it is significant.

##### Prop collisions

Consider two polymorphic components: `Highlight`, which contributes a
configurable background color to an element, and `Outline`, which similarly adds
a colored outline around an element.

![Highlight and Outline component examples](images/highlight-outline/highlight-outline.png)

```tsx
<>
  <Highlight color="yellow">Highlight</Highlight>
  <Outline color="yellow">Outline</Outline>
</>
```

You can combine the two using the `as` prop.

![Highlight and Outline combination](images/highlight-outline/combo-monochrome.png)

```tsx
<Highlight as={Outline} color="yellow">
  Highlight + Outline
</Highlight>
```

But what if you want a two-tone effect?

![Two-tone effect using the Highlight and Outline components](images/highlight-outline/combo-two-tone.png)

```tsx
<Highlight as={Outline} color="hotpink" color="lightblue">
  Highlight + Outline
</Highlight>
```

Unfortunately, it isn't possible to achieve this on the basis of the `Highlight`
and `Outline` components because you can't control each component's `color` prop
independently. The duplicate `color` prop in the code example simply wouldn't
compile.

Now let's return for a moment to the monochromatic combination that actually
works.

![Highlight and Outline combination](images/highlight-outline/combo-monochrome.png)

By default, this renders a generic `<div>` element. But what if you need to
render a `<button>` element instead?

```tsx
<Highlight as={Outline} as="button" color="yellow">
  Highlight + Outline
</Highlight>
```

Once again, the duplicate `as` prop wouldn't compile, making it impossible to
combine the two components _and_ control their rendered HTML at the same time.

In short, the prop collision issue presents two challenges:

1. If two components share a prop name, that prop can't be controlled
   independently for each component. (Technically, one of the props hides the
   other's interface—imagine if they have different types!)

2. Composition is limited to two components—unless you need a custom HTML tag,
   in which case composition isn't possible because the `as` prop is already
   used for that purpose.

#### Final thoughts on the `as` prop

For the most part, the `as` prop has served me well; but I'm concerned about the
potential for clashing props to create defects much more insidious than the one
demonstrated above by the `color` prop. Moreover, I'm really not happy having to
choose between component composition and semantic markup. Finally, the ability
to compose three or more components together could prove interesting, enabling a
higher degree of reuse than the `as` prop currently allows.

### The `asChild` prop

The `asChild` prop, popularized by [Radix](https://radix-ui.com), addresses the
issues of the `as` prop by allowing the component's child element to determine
how it is rendered. Using `asChild`, here is how the button-as-link use case I
introduced earlier would be implemented:

```tsx
<Button asChild>
  <a href="https://react.dev">Get started</a>
</Button>
```

To the compiler, this just looks a plain HTML `<a>` element nested as the child
of some `<Button>` element. This one weird trick should make the TypeScript
performance and type inference much more predictable.

And because `<Button>` and `<a>` are now separate elements, a given prop can be
set explicitly on either one; thus, prop collisions are eliminated.

Problem(s) solved, right?

Well, yes—but what about the problems _created_?

#### Problems with the `asChild` prop

Earlier, I showed that the `as` prop has one serious composability issue along
with some possible TypeScript-related inconveniences. On the other hand, the
`asChild` prop, promoted as the `as` prop successor, is not such an obvious
improvement when considering a few other aspects.

##### No contract between parent and child

A component implementing the `asChild` prop accepts any element as "child",
forwarding props without regard to whether that type of element is designed to
accept them. That means, when implementing the "child" component, you must
consider the private implementation details of the "parent" component—and hope
they don't change, since the TypeScript compiler can't guarantee compatibility.

To see the problem firsthand, check out
[this demo](https://githubbox.com/nsaunders/writing/tree/wip/function-aschild-polymorphic-components/posts/function-aschild-polymorphic-components/sandboxes/aschild-prop-no-contract).

##### Invalid HTML

`asChild`'s prop forwarding scheme can easily produce invalid markup. Look no
further than the button-as-link use case for evidence. Consider what happens
when you disable the button.

```tsx
<Button asChild disabled>
  <a href="https://react.dev">Get started</a>
</Button>
```

The resulting HTML would look essentially like the following—with no TypeScript
error to alert you that the `disabled` prop
[is not compatible](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)
with an `<a>` element.

```html
<a href="https://react.dev" disabled>Get started</a>
```

On the other hand, each of the following _would_ result in a type error as
expected.

```tsx
<>
  <a href="https://react.dev" disabled>
    Get started
  </a>
  <Button as="a" href="https://react.dev" disabled>
    Get started
  </Button>
</>
```

To compare for yourself, have a look at
[this demo](https://githubbox.com/nsaunders/writing/tree/wip/function-aschild-polymorphic-components/posts/function-aschild-polymorphic-components/sandboxes/aschild-prop-invalid-html).

##### No control over prop forwarding

`asChild` assumes a straightforward 1-to-1 mapping between the props forwarded
from the "parent" and the props accepted by the "child". But, as the previous
example shows, that may be a bit too optimistic.

A reasonable implementation for a "disabled" `<a>` element might look something
like this:

```tsx
<a
  href="https://react.dev"
  className="disabled"
  aria-disabled="true"
  onClick={e => {
    e.preventDefault();
  }}>
  Get started
</a>
```

In the button-as-link context, the `disabled` prop forwarded from the `Button`
"parent" would be represented in three distinct "child" props: `className`,
`aria-disabled`, and `onClick`. Because `asChild` hides its prop forwarding
logic, it isn't possible to achieve this—instead, you'll be stuck with that
invalid `disabled` attribute in the resulting HTML, as discussed earlier.

##### Contraindicated use of `cloneElement`

The implementation of the `asChild` prop (Radix's
[`Slot` component](https://github.com/radix-ui/primitives/blob/eca6babd188df465f64f23f3584738b85dba610e/packages/react/slot/src/Slot.tsx#L64-L67)),
utilizes the `cloneElement` function. However, the
[React docs](https://react.dev/reference/react/cloneElement) warn that "using
`cloneElement` is uncommon and can lead to fragile code" while "[making] it hard
to tell how the data flows through your app". The React documentation continues
on to
[recommend the render prop as a "more explicit" alternative](https://react.dev/reference/react/cloneElement#alternatives)
where "you can clearly trace" the props.

#### Final thoughts on the `asChild` prop

Over the years, I've used many technologies that initially appeared to make
things easier but eventually taught me that they were merely hiding complexity,
rather than eliminating it. Unfortunately, the `asChild` prop seems to fit that
profile.

It solves the problems of the `as` prop by pretending that one element is
actually two. The type checker has no knowledge of `asChild`'s implicit magic
and is powerless to prevent the "parent" component from injecting any number of
props into the "child" element, whether compatible or not.

The side effects of this design might include tight coupling between "parent"
and "child" components, whose implementation details must line up without
compiler help; invalid HTML; and incomplete functionality, particularly in the
case of a "child" component whose code you don't control (e.g. a third-party
`Link` component). Moreover, the React docs warn that `asChild`'s use of
`cloneElement` "makes it harder to trace the data flow"

To its credit, the `asChild` prop has raised awareness about some issues with
the `as` prop, and it _has_, technically, solved those issues. It has also
reminded us that the `as` prop isn't the only way to do polymorphic components.

## Introducing _Function asChild_

After realizing the many pitfalls of the `as` and `asChild` props, I began the
search for a safer and more flexible approach to polymorphic components. I'm
happy to report that, rather than inventing something new, I discovered an
approach that builds upon an established React pattern dating back to at least
2016, a [render prop](https://www.patterns.dev/posts/render-props-pattern)
variant known as
[Function as Child Component](https://www.merrickchristensen.com/articles/function-as-child-components/).

### A quick preview

Before we dive into the implementation, I'd like to offer a glimpse of what
Function asChild looks like from a "client code" perspective. Let's return to
the polymorphic `Button` once again.

By default, the `Button` component provides the same interface as the HTML
`button` tag, enhanced with any additional props, e.g. a `variant`.

```tsx
<Button type="submit" form="loginForm" variant="primary">
  Submit
</Button>
```

When you want to render a different type of element, you pass a render function
as child.

```tsx
<Button variant="primary">
  {({ disabled, style, ...restProps }) =>
    exhausted(restProps) && (
      <a
        href="https://react.dev"
        aria-disabled={disabled}
        onClick={e => {
          disabled && e.stopPropagation();
        }}
        style={{
          ...style,
          ...(disabled ? { opacity: 0.5 } : undefined),
        }}>
        Get started
      </a>
    )
  }
</Button>
```

If you squint a little bit, you might recognize that this JSX structure actually
resembles its `asChild` "equivalent". However, since the child is a render
function rather than an element, this solution avoids implicit magic, doesn't
break the type checker, and produces valid HTML.

If you've seen render props before, you might have a pretty good idea of what's
going on here. But it's easy to miss some essential details of this approach
without walking through its implementation and usage. So, with that, let's get
started.

### Polymorphic component implementation

The first step is to define the interface between the `Button` component and the
render function. I usually refer to this as the _forward props_. For a simple
component whose scope is limited to visual styling, often this will be limited
to a single `style` or `className` prop.

```tsx
export type ButtonForwardProps = {
  className?: string;
};
```

Next, let's define the `Button` props. The union type forces the client code to
choose between the default HTML `button` tag interface and the function-as-child
interface. The `variant` prop is available in either case.

```tsx
import { ComponentProps, FunctionComponent } from "react";
import { U } from "ts-toolbelt";

export type ButtonProps = U.Strict<
  ComponentProps<"button"> | FunctionComponent<ButtonForwardProps>
> & {
  variant?: "primary" | "secondary";
};
```

After defining the prop types, the next step is to set up the `Button` as a
[ref-forwarding](https://react.dev/reference/react/forwardRef) function
component. The ref forwarding is useful for the default case of a HTML
`<button>`.

```tsx
import { ComponentType, forwardRef } from "react";

export const Button = forwardRef<HTMLButtonElement, O.Omit<ButtonProps, "ref">>(
  function Button(
    { children, className = "", variant = "secondary", ...restProps },
    ref,
  ) {
    // TODO
  },
) as ComponentType<ButtonProps>;
```

The implementation begins with the `forwardProps` object, which will include a
dynamic `className` based on the incoming `variant` prop value.

Then, it determines whether children is a render function:

1. If so, then it calls that function, passing `forwardProps` as the argument,
   and returns the result.
2. Otherwise, `children` is simply the button content. Return a `<button>`
   element, first spreading `forwardProps`, followed by `restProps` (any HTML
   button props that might have been provided)—and, finally, don't forget to
   forward `ref` and `children`.

```tsx
import { ComponentType, forwardRef } from "react";
import { isRenderFunction } from "render-prop";

export const Button = forwardRef<HTMLButtonElement, O.Omit<ButtonProps, "ref">>(
  function Button(
    { children, className = "", variant = "secondary", ...restProps },
    ref,
  ) {
    const forwardProps: ButtonForwardProps = {
      className: `button button-${variant} ${className}`,
    };

    return isRenderFunction(children) ? (
      children(forwardProps)
    ) : (
      <button {...forwardProps} {...restProps} ref={ref}>
        {children}
      </button>
    );
  },
) as ComponentType<ButtonProps>;
```

That's all it takes to implement the polymorphic `Button` component!

Due to some quirks of TypeScript, however, how you _use_ the component can make
a significant difference in terms of type safety. So, to learn how to use it in
the most effective way, read on.

### Polymorphic component usage

At this point, we actually have a working polymorphic component. And here is how
most people (myself included) would be inclined to use it:

```tsx
<Button variant="secondary">
  {props => (
    <a href="./home" {...props}>
      Cancel
    </a>
  )}
</Button>
```

Unfortunately, TypeScript doesn't work as expected sometimes, and the prop
spread is one such case. Due to a long-standing
[issue](https://github.com/Microsoft/TypeScript/issues/29883), excess props
don't produce a compiler error.

You won't love the workaround, but hopefully you'll appreciate its effectiveness
in preventing prop forwarding mistakes.

#### Avoiding the spread

When in doubt, the best way to cope with the prop spread's unsound nature is to
avoid it entirely. That means fully destructuring the props and forwarding them
individually.

```tsx
<Button variant="secondary">
  {({ className }) => (
    <a href="./home" className={className}>
      Cancel
    </a>
  )}
</Button>
```

But even this has its pitfalls:

1. **Forgotten props**: It's easy to forget to destructure some of the props.
   Even if you account for all of them initially, additional props could be
   added to the `ButtonForwardProps` interface in the future.

2. **Unused props**: Similarly, it's easy to forget to actually forward some of
   the props, even if you remembered to destructure them.

Fortunately, each of these problems has a solution.

#### Exhaustiveness check

Let's make a a small change by adding `...restProps` to the prop-destructuring
expression.

```tsx
<Button>
  {({ className, ...restProps }) => (
    <a href="./home" className={className}>
      Cancel
    </a>
  )}
</Button>
```

If you've destructured all of the props as intended, `restProps` will be an
empty object, i.e. `{}`. You can assert this with the `exhausted` function,
which produces a TypeScript error when called with a non-empty object.

```tsx
import { exhausted } from "render-prop";

<Button>
  {({ className, ...restProps }) => exhausted(restProps) && (
    <a href="./home" className={className}>
      Cancel
    </a>
  ))}
</Button>
```

For example, here's what happens if you forget about the `className` prop:

TODO

As I mentioned earlier, it's still possible to destructure a prop and forget to
forward it. Next, I'll show you an additional measure to prevent this common
mistake.

#### Unused prop check

In general, all of the props passed to a render function should actually be used
in some way; otherwise, aspects of the component's appearance or behavior might
be lost. Since the `exhausted` function already guarantees that the props object
is fully destructured, all that's left is to ensure that none of these props are
unused.

For this, I simply recommend the ESLint rule
[`@typescript-eslint/no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars/).

For example, here's what happens if you forget to forward the `className` prop:

TODO

If you aren't already using ESLint, see
[typescript-eslint's Getting Started guide](https://typescript-eslint.io/getting-started)
for more information on how to configure your project.

### Reviewing the solution

Now that you've seen how to implement and use the Function asChild approach for
polymorphic components, let's consider its relative advantages:

1. Predictable TypeScript performance and type inference

1. Prop collision avoidance

1. High degree of type safety

1. Transparent prop forwarding scheme that you control

1. Valid HTML output

1. Ability to compose three or more components

1. Loose coupling between components

Compared to the `as` and `asChild` props, Function asChild offers a more
flexible and far safer approach to polymorphic components.

What's the catch?

Some would call a render function—even an _unsafe_ render function that uses the
prop spread—"boilerplate" in comparison to the "convenience" of implicitly
mutating elements behind the scenes.

Honestly, they misinterpret _thoroughness and precision_ as _verbosity_.

---

To succeed in this, each component I build must be adaptable to many different
use cases so that it can be reused consistently. One React pattern that has
helped me to deliver the required flexibility is that of the _polymorphic
component_, which offers you direct control over its rendered HTML output. A
common example is a `Button` component that normally renders a HTML `<button>`
element with enhanced visual styling, but which can be configured instead to
render an `<a>` element with the _appearance_ of a button, e.g.

<!-- prettier-ignore-start -->
```tsx
{/* Setting `as="a"` unlocks additional `<a>` props such as `href`. */}
<Button as="a" href="./register">
  Register
</Button>
```
<!-- prettier-ignore-end -->

But recently I have noticed the `as` prop—practically synonymous with
"polymorphic component"—falling out of favor a bit, a few reasons being

1. slow TypeScript performance,
1. poor type inference, and
1. conflicting prop names.

Its trendy "successor",

```tsx
<Button asChild>
  <a href="./register">Register</a>
</Button>
```

And because `<Button>` and `<a>` are now separate JSX elements, a given prop can
be set explicitly on either element; thus, prop conflicts are eliminated.

Problems solved, right?

In short, yes—the `asChild` approach addresses the specific set of problems
outlined above; and its tremendous popularity suggests that, for many, the story
ends there. But is it truly a sound alternative to the `as` prop?

## `asChild` problems

The `asChild` prop exemplifies the constant challenge of "engineering
trade-offs": It solves some problems while introducing new—and possibly
worse—issues of its own.

### Excess props

The first problem is that `asChild`'s prop forwarding scheme easily produces
invalid markup. Consider the simple case of a `type` prop added to the parent
`<Button>` element:

```tsx
<Button asChild type="button">
  <a href="./register">Register</a>
</Button>
```

The result would be an invalid markup structure along the lines of

```html
<a href="./register" type="button">Register</a>
```

Notice that the `type="button"` attribute, which is applicable to a HTML
`<button>` element, is added to the `<a>` element in error. While, in this case,
the issue might be "obvious" in the client code which adds the forwarded `type`
prop (for illustrative purposes), the `Button` component itself could just as
easily add the prop as an internal implementation detail, leading to the same
unfortunate result.

### Implicit magic

Aside from the vague hint offered by its name, the `asChild` prop doesn't do
anything to explain what actually happens "behind the scenes" when enabled. To
demonstrate this point, let's compare to a more explicit
[render prop](https://legacy.reactjs.org/docs/render-props.html) approach:

```tsx
<Button render={props => <a {...props} />}>Register</Button>
```

Although blindly forwarding all of the props here is probably a bit of an
anti-pattern as well, this prop forwarding approach has significant advantages
over the `asChild` approach:

1. Because the prop spread is a widely-recognized _language feature_, it is
   clear that the render function is forwarding all props directly to the `<a>`
   element.

1. The `props` parameter has a specific type, which can easily be inspected in
   the code editor's hover help to discover which props might be passed:

![Hover help showing the type of the props parameter](./render-prop-hover-popup.png)

On the other hand, the `asChild` approach hides all of this information and
requires some kind of additional effort to gain a thorough understanding of the
prop forwarding, such as reading component implementation details; inspecting
the rendered HTML output; or, in perhaps the best-case scenario, RTFD.

### No control over prop forwarding

When we can't see the prop forwarding logic, we also can't change it. This turns
out to be a pretty severe limitation because `asChild` assumes a straightforward
1-to-1 mapping between parent and child props, an assumption already established
to be false in the previous example demonstrating "excess props". Returning to
that example, we might imagine that the `Button` component applies distinct
visual styling to each type of button:

![Two buttons, each with a distinct type attribute and visual appearance](./button-types.png)

Let's suppose that we would simply like to rename the `type` prop to
`data-button-type`, avoiding the problem of invalid HTML while producing an
attribute that we can target in a style rule selector. So, given this:

```tsx
<Button asChild type="button">
  <a href="./home">Cancel</Button>
</Button>
```

We want this result:

```html
<a href="./home" data-button-type="button">Cancel</a>
```

Well, since `asChild` hides the prop forwarding logic, we're out of luck: We
have no way to rename a prop.

### No control over prop merging

One feature of the `asChild` prop is that it automatically merges the props
supplied by the parent with the props already set on the child element in what
we must hope is a predictable manner that aligns with the use case at hand.
Despite my critical view, I have found the algorithm used in
[Radix](https://www.radix-ui.com/)'s popular `asChild` implementation to meet my
expectations most of the time. For example, child props usually replace those
inherited from the parent; and, in the special cases of `className` and `style`,
the values are combined as expected. The problem is, it isn't always obvious how
a given prop should be merged. Take the `onClick` prop for instance:

```tsx
<Button asChild onClick={buttonHandler}>
  <div onClick={divHandler}>Click me</div>
</Button>
```

It is unclear what should happen when the `<div>` element is clicked. Here are
some reasonable possibilities:

1. The `buttonHandler` function should be invoked first, followed by
   `divHandler`.
2. The `divHandler` function should be invoked first, followed by
   `buttonHandler`.
3. The child element's `onClick` prop should override the parent's, so only
   `divHandler` should be invoked.

Most likely, the "correct" behavior is use-case-dependent; but, once again,
whatever behavior is hidden behind the `asChild` interface can't be changed.

### Contraindicated use of `cloneElement`

The implementation of `asChild` utilizes React's `cloneElement` API, which can
be confirmed by reading the source of
[Radix's `Slot` component](https://www.radix-ui.com/docs/primitives/utilities/slot).
The [React docs](https://react.dev/reference/react/cloneElement) warn that
"using `cloneElement` is uncommon and can lead to fragile code", continuing on
to
[recommend the render prop as a "more explicit" alternative](https://react.dev/reference/react/cloneElement#alternatives)
where "you can clearly trace" the props.

### Final thoughts on `asChild`

From my perspective, `asChild` has been promoted with great enthusiasm and very
little acknowledgment of its downsides; but I applaud its originator for raising
awareness about significant problems with the `as` prop. And while I am now
raising awareness about `asChild`, to be honest, I doubt I can invent a better
abstraction myself. The good news is, maybe I don't have to...

## Old pattern, new use case

As it turns out, we can build a polymorphic component whose API resembles the
`as` and `asChild` approaches—avoiding their pitfalls, of course—on the basis of
an existing design pattern called
[Function as Child Component](https://www.merrickchristensen.com/articles/function-as-child-components/),
a variant of the render prop pattern that dates back to at least 2016. Let's
continue with our example of a `Button` component as we explore this approach.

### A quick preview

I'll start by offering a glimpse of what the final result will look like from a
"client code" perspective.

First, our `Button` component will work exactly like a HTML `<button>` element
by default:

<!-- prettier-ignore-start -->
```tsx
{/* You can use any combination of HTML `<button>` props. */}
<Button type="submit" form="registration-form">
  Register
</Button>;
```
<!-- prettier-ignore-end -->

Then, when it is necessary to render custom markup or compose `Button` with
another component, we will be able to pass a function as the child, e.g.

<!-- prettier-ignore-start -->
```tsx
{/* You can't pass any HTML `<button>` props here. */}
<Button>
  {({ style, ...restProps }) => ifExhausted(restProps, (
    <a href="./home" style={style}>Cancel</a>
  ))}
</Button>
```
<!-- prettier-ignore-end -->

There's no implicit magic here; but there _is_ more than initially meets the
eye, so let's dive in.

### Child props

We first need to define the interface between the parent and child components.
In other words, which props will the parent pass to the child? For illustrative
purposes, we can keep it as simple as a single `style` prop.

```typescript
import { CSSProperties } from "react";

type ButtonChildProps = {
  style?: CSSProperties;
};
```

### `Button` props

Our next task is to define the props for the `Button` component itself.
Remember, by default, `Button` will match the interface of a standard HTML
`<button>` element. Alternatively, the client code can provide a render function
as the child.

<!-- prettier-ignore-start -->
```typescript
import { ComponentPropsWithoutRef, ComponentType } from "react";
import { U } from "ts-toolbelt";

type ButtonProps = U.Strict<
  | ComponentPropsWithoutRef<"button">
  | { children: ComponentType<ButtonChildProps> }
>;
```
<!-- prettier-ignore-end -->

The
[union type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
ensures that the client can set either some combination of HTML `<button>` props
or a function asChild, but not both. The `Strict` utility from
[ts-toolbelt](https://millsp.github.io/ts-toolbelt/modules/union_strict.html) is
necessary for the union type to behave as we would expect due to
[a long-standing TypeScript issue](https://github.com/Microsoft/TypeScript/issues/20863).

### `Button` component

Now we're ready to define the `Button` component.

```typescript
function Button({ children, ...buttonProps }: ButtonProps) {
  // TODO
}
```

The first implementation detail is an object matching the `ButtonChildProps`
interface. This will include all of the props passed to the child or to the
default HTML `<button>` element.

```typescript
function Button({ children, ...buttonProps }: ButtonProps) {
  const childProps: ButtonChildProps = {
    style: {
      border: 0,
      borderRadius: 8,
      margin: 0,
      padding: "8px 16px",
      background: "black",
      color: "white",
      font: "16px sans-serif",
      textDecoration: "none",
      display: "inline-block",
    },
  };

  // TODO
}
```

Next, if the child is a render function, we can use it like an ordinary function
component, spreading the `childProps` object we defined a moment ago.

```tsx
function Button({ children, ...buttonProps }: ButtonProps) {
  const childProps: ButtonChildProps = {
    // ...
  };

  // Note: we will implement `isRenderFunction` in a later step.
  if (isRenderFunction(children)) {
    const Component = children;
    return <Component {...childProps} />;
  }

  // TODO
}
```

Otherwise, we should just fall back to the default case of a HTML `<button>`
element. Again, we need to spread `childProps`; and, this time, we also need to
spread `restProps`, which could be any combination of HTML `<button>` props
according to the `ButtonProps` type. Finally, we need to provide `children`
explicitly since earlier prop destructuring separates it from `restProps`.

```tsx
function Button({ children, ...restProps }: ButtonProps) {
  const childProps: ButtonChildProps = {
    // ...
  };

  if (isRenderFunction(children)) {
    // ...
  }

  return (
    <button {...childProps} {...restProps}>
      {children}
    </button>
  );
}
```

### `isRenderFunction` utility (etc.)

As its name suggests, the `isRenderFunction` function determines whether the
provided value represents a render function. If it does, then our `Button`
component defined above can render it like a function component.

```typescript
import { ComponentType, ReactNode, isValidElement } from "react";

function isRenderFunction<P>(
  x: ComponentType<P> | ReactNode,
): x is ComponentType<P> {
  return (
    typeof x === "function" ||
    (!!x && typeof x === "object" && !isValidElement(x) && !isIterable(x))
  );
}

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x;
}
```

Just in case you were wondering, the `isIterable` function identifies a
[Fragment](https://react.dev/reference/react/Fragment), whose type is
`Iterable<ReactNode>`.

### It's (only) progress

At this point, we actually have a working polymorphic component. If you've used
render props before and you're like me, perhaps you're tempted to jump in here
and try it out.

```tsx
<Button>
  {props => (
    <a href="./home" {...props}>
      Cancel
    </a>
  )}
</Button>
```

But we are not done yet. Due to
[a long-standing TypeScript issue](https://github.com/Microsoft/TypeScript/issues/29883),
the prop spread is a bit unsound because excess props don't produce a compiler
error. Is there anything we can do?

### Avoiding the spread

The way to cope with the prop spread's unsound nature is to avoid it entirely.
That means fully destructuring the props and forwarding them individually.

```tsx
<Button>
  {({ style }) => (
    <a href="./home" style={style}>
      Cancel
    </a>
  )}
</Button>
```

The problem with this approach is twofold:

1. **Forgotten props**: It is easy to forget to destructure some of the props.
   Even if you get it right the first time, this solution doesn't account for
   the possibility of future changes in the `ButtonChildProps` interface.
2. **Unused props**: In the same vein, it is easy to forget to forward some of
   the props, even if you remembered to destructure them.

Next, we'll take a look at what we can do to mitigate these issues.

#### Exhaustiveness check

Let's make a a small change by adding `...restProps` to our prop-destructuring
expression.

```tsx
<Button>
  {({ style, ...restProps }) => (
    <a href="./home" style={style}>
      Cancel
    </a>
  )}
</Button>
```

If we've destructured all of the props, `restProps` should be an empty object,
i.e. `{}`. With the help of a small utility function, the compiler can guarantee
this to be the case.

```typescript
import { F } from "ts-toolbelt";

function ifExhausted<T, U>(t: F.Exact<T, {}>, u: U): U {
  return u;
}
```

This is little more than an identity function: The first argument must be
exactly `{}`, and the second argument is always returned. Let's put it to work!

<!-- prettier-ignore-start -->
```tsx
<Button>
  {({ style, ...restProps }) => ifExhausted(restProps, (
    <a href="./home" style={style}>
      Cancel
    </a>
  ))}
</Button>
```
<!-- prettier-ignore-end -->

Now, a compiler error will alert us to any props that haven't been destructured.
Nice! As I mentioned earlier, though, it's still possible to destructure a prop
and forget to forward it. Next, we'll take an additional measure to prevent this
common mistake.

#### Unused variable check

In general, all of the props passed to our render function should actually be
used in some way; otherwise, aspects of the `Button` component's appearance or
behavior might be lost. Since the `ifExhausted` function already guarantees that
the props object is fully destructured, all that's left is to ensure that there
are no unused props.

For this, I recommend the ESLint rule
[`@typescript-eslint/no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars/).

If you aren't already using ESLint, I recommend
[typescript-eslint's Getting Started guide](https://typescript-eslint.io/getting-started)
for more information on how to configure your project to use it.

### Problems solved

At this point, we have finished the implementation of our polymorphic `Button`
component using this "Function asChild" approach and learned how to use it as
safely as possible.

Let's review the problems we have solved along the way:

1. Most importantly, we have made the component polymorphic.

1. We have created a "default" developer experience identical to that of the
   widely-recognized `as` and `asChild` props. That is, when a `<Button>` is
   just a `<button>`, you can use it as such.

1. We have leveraged a well-established React pattern (the render prop) that
   offers predictable TypeScript performance and type inference.

1. We have avoided prop collisions by allowing a given prop to be set explicitly
   on the parent or child.

1. We have provided visibility into—and control over—how props are forwarded and
   merged.

1. We have prevented excess props from being forwarded to the child without our
   knowledge.

1. We have ensured that all forwarded props are used in the implementation of
   the render function.

For now, I think our work here is done! But, if you'd like to play, you are
welcome to check out the
[Function asChild demo on CodeSandbox](https://githubbox.com/nsaunders/nsaunders.github.io/tree/master/content/posts/function-aschild-polymorphic-components/sandboxes/basic?file=src/App.tsx).

## The perfect approach?

As you know, software engineers don't deal in perfection. Our job is to gather
as much evidence as we can; to weigh the pros and cons; and to choose the option
that represents the most favorable balance. With that said, taking many factors
into account, the scales tip heavily toward "Function asChild" as the most
trustworthy approach to polymorphic components considered here.

To be honest, had this use case for the "Function as Child Component" pattern
been clearly identified sooner, I'm not even sure if the `as` or `asChild` props
would have emerged in the first place or been widely considered as serious
alternatives.
