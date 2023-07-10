---
title: Function asChild
description: Unraveling the unsound nature of React polymorphic components and looking for a safer approach
date: 2023-06-19
tags:
  - TypeScript
  - React
---

As a design system engineer, my primary goal is to deliver a consistent user
experience across a range of products. To succeed in this, each component I
build must be adaptable to many different use cases so that it can be reused
consistently. One React pattern that has helped me to deliver the required
flexibility is that of the _polymorphic component_, which offers you direct
control over its rendered HTML output. A common example is a `Button` component
that normally renders a HTML `<button>` element with enhanced visual styling,
but which can be configured instead to render an `<a>` element with the
_appearance_ of a button, e.g.

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

Its trendy "successor", the `asChild` prop, addresses these issues by allowing
the child element to determine how the component is rendered. Using `asChild`,
the code above would be rewritten as:

```tsx
<Button asChild>
  <a href="./register">Register</a>
</Button>
```

Now the TypeScript performance and type inference should be much more
predictable, since the custom element type is defined by a simple HTML `<a>`
element.

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
