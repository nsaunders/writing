---
title: The perils of the cascade
description:
  The cascade in CSS adds extra layers of unpredictability and creates
  unnecessary cognitive overhead. Inline styles offer a simpler, more reliable
  styling approach.
image_src: assets/images/cover.webp
image_alt: A person being washed down a cascade waterfall
published: 2025-01-29T12:00:00.000Z
tags:
  - CSS
---

If you've ever worked on a large web application, you've undoubtedly experienced
a moment of CSS-induced frustration. Maybe you added a ruleset that inexplicably
didn't work, or maybe someone else added one that broke your carefully-crafted
component. In any case, the culprit is almost always the same: the cascade. This
core feature of CSS is also the root of many challenges. After watching
teammates struggle and being burned many times myself, I've switched to inline
styles, and you should too. Here's why.

## Problems with the cascade

### Complex style resolution algorithm

CSS may seem simple at first, but at any non-trivial scale the complexity of how
styles are resolved becomes painfully apparent. Understanding which
[ruleset](https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax#css_rulesets)
will apply requires reasoning about source order,
[specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity), and
[cascade layer](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
precedence. With manually-authored CSS, this is often difficult and requires
relatively deep CSS knowledge. Using a CSS framework or a CSS-in-JS solution
that implicitly generates style sheets at runtime further adds to the confusion.

For example, I recently implemented a proof-of-concept demonstrating
[Chakra UI](https://chakra-ui.com/) v2 and v3 working together in the same app.
(This may sound impractical, but the truth is quite the opposite: To make the
upgrade feasible for our large codebase, my team needed a gradual migration path
to v3.) I began this exercise by creating a custom button
[recipe](https://www.chakra-ui.com/docs/theming/recipes). When I tested it out,
I was surprised to find that the recipe didn't seem to work at all. Upon closer
inspection, I discovered that the problem was caused by v3's use of cascade
layers: Because v2's global
[CSS reset](https://en.wikipedia.org/wiki/Reset_style_sheet) consists of
unlayered styles which are prioritized over layered styles, it
[accidentally overrode](https://x.com/agilecoder/status/1864753902639251772) all
v3 styles, including those generated from my button recipe. Since
author-controlled cascade layers are a relatively new CSS feature, this was my
first real-world experience with the problem of unlayered styles having the
highest priority. But before this, I had battled many other cascade defects
caused by specificity and source order.

One such case involved a component library I built being used in conjunction
with [Emotion](https://emotion.sh). A colleague was understandably baffled when
`<Text variant="heading1" css={{ color: "#666666" }}>...</Text>` rendered
magenta text (the default for the `"heading1"` variant in our system) instead of
the dark gray color he explicitly set inline. The problem?

- The style sheets Emotion generates use low-specificity selectors, e.g.
  `.css-9fh586 { color: #666666 }`. What looks like a high-priority inline style
  is actually very easy to override.
- Because of reasons, the component library style sheet was inserted into the
  DOM after the Emotion-generated style sheet, indeed overriding the custom
  style with the unwanted default.

Time and time again, examples like these have proven the cascade to be a source
of defects that can be difficult to understand and resolve, especially without
advanced CSS knowledge.

### Global scope

CSS is global by default, which invites unwanted interactions.

It's very common for component libraries and CSS frameworks to take advantage of
the global nature of CSS in the form of a reset style sheet: Modifying global
defaults means they don't have to define as many explicit styles for each
component. But this approach assumes that the library or framework in question
is the only one on the page and doesn't need to coexist with unrelated style
sheets. In practice, this is often untrue: Look no further than the Chakra
proof-of-concept I mentioned earlier, where each version includes its own global
CSS reset.

Likewise, I've worked on many projects in the past that involved integrating
modern features into existing applications, often resulting in clashes between
their respective style sheets due to lack of scoping. For example, one time I
needed to integrate an app header, built with a component library in React, into
a legacy product. The links in the app header were styled using a `.nav-link`
selector. Meanwhile, an existing style sheet authored years earlier contained a
ruleset that applied conflicting styles via an `a:link` selector. The latter
ruleset "won" due to higher specificity, resulting in visual inconsistencies.

I've also seen accidental use of selectors that were "too global" in nature.
Recently a colleague, intending to suppress a row hover effect in a particular
data table, ended up disabling that effect across all data tables throughout the
entire application. New to the codebase, he had mistakenly believed that a CSS
import would be scoped automatically. (Given the popularity of build-time CSS
magic nowadays, can you really blame him?)

The global scope of CSS is a source of conflict between libraries, legacy code,
and even individual components. Avoiding the resulting defects often requires
careful scoping or isolation.

### Mutability

An API defines the rules of how a component interacts with client code. When
client code penetrates API boundaries, it makes support and testing difficult
for the library maintainer and complicates the upgrade path for the client.

The cascade allows clients to bypass a component's API (props). Instead of
following the rules of interaction, the client can reach in and modify the
private implementation details of the component, unsafely coercing it into
alignment with the specific use case at hand. In the short term, this power may
seem useful, but eventually it will lead to defects when component
implementation details change unexpectedly.

As a component library maintainer, I would much rather update a component's API
to meet the client's need than for the client to modify its internals. If I were
even aware of the latter case, it would severely undermine my confidence to make
changes due to the increased risk of a regression.

## Inline styles offer a solution

In the words of Leonardo da Vinci, "Simplicity is the ultimate sophistication."
Inline styles embody this principle by completely sidestepping cascade-related
issues:

1. **Eliminating complexity**. Inline styles provide a straightforward and
   deterministic styling mechanism that doesn't require you to think about
   source order, specificity, or cascade layers.

1. **Inherent scope**. Inline styles naturally avoid global scope issues since
   they apply only to the element on which they are defined.

1. **Immutable by default**. By encapsulating styles within the component,
   inline styles reinforce API boundaries and protect against unexpected
   overrides.

### Addressing limitations

The reason most people avoid inline styles is that they don't explicitly support
conditional styling (like a hover effect or responsive behavior) due to their
lack of support for pseudo-classes, media queries, etc. But it turns out that an
obscure CSS variable trick offers a solution to these technical limitations. To
learn more, please read my post
[From CSS madness to CSS Hooks](../css-madness-to-hooks/).

## Wrapping up

People often assume their chosen styling solution is immune to cascade defects
because it incorporates scoping mechanisms or cascade layers. In reality, these
are only partial mitigations, remaining vulnerable to high-specificity selectors
and unlayered styles. By adopting inline styles, you can avoid the complexities
and pitfalls of the cascade entirely, embracing a simpler, more maintainable
approach to styling.

Inline styles may not be the right choice for every project, but for large-scale
applications and reusable component libraries, they provide clarity,
predictability, and peace of mind. So take the plunge—your future self (and your
teammates) will thank you.
