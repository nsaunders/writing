/* eslint @typescript-eslint/no-unused-vars: error, @typescript-eslint/no-use-before-define: off */

import {
  ComponentPropsWithoutRef,
  ComponentType,
  CSSProperties,
  isValidElement,
  memo,
  ReactNode,
  useMemo,
  useState,
} from "react";
import deepEqual from "deep-equal";
import { F, U } from "ts-toolbelt";

/**
 * The props that the {@link Button} child component (render function) must
 * accept when rendering a different type of element than the default HTML
 * `<button>`
 */
type ButtonChildProps = {
  style?: CSSProperties;
};

/**
 * {@link Button} component props
 *
 * @remarks
 * The `Strict` utility guards against excess fields. Thus, when creating a
 * `Button` element, either you can provide any HTML button props; or, if you
 * want to render another type of element, you must specify no props except
 * for children consisting of a render function that accepts the
 * {@link ButtonChildProps}.
 */
type ButtonProps = U.Strict<
  | ComponentPropsWithoutRef<"button">
  | { children: ComponentType<ButtonChildProps> }
>;

/**
 * A polymorphic button component
 * 
 * @remarks
 * 
 * If you just need a true HTML `<button>` element, you can use this exactly
 * the same way, specifying any combination of HTML button props.
 * 
 * On the other hand, if you need to render some other type of element that only
 * has the visual design of a button (e.g. an `<a>` element), you can only
 * provide one prop, children, consisting of a render function accepting
 * the {@link ButtonChildProps}. You must "spread" these props on the child
 * element returned by this render function (although it is recommended to set
 * each prop individually to avoid excess properties which might be invalid; see
 * {@link ifExhausted} and examples within the {@link App} component).
--------------------------------------------------------------------------------
 */
function Button({ children, ...buttonProps }: ButtonProps) {
  if (isRenderFunction(children)) {
    const Component = children;
    return (
      <Component
        style={{
          border: 0,
          borderRadius: 8,
          margin: 0,
          padding: "8px 16px",
          background: "black",
          color: "white",
          font: "16px sans-serif",
          textDecoration: "none",
          display: "inline-block",
        }}
      />
    );
  }

  return (
    <Button>
      {({ style, ...restProps }) =>
        ifExhausted(
          restProps,
          <button style={style} {...buttonProps}>
            {children}
          </button>,
        )
      }
    </Button>
  );
}

// These counters are used in the `memo()` demo.
let renders1 = 0,
  renders2 = 0;

/** Main component showing all of the demos */
export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <h2>Basic</h2>
        <em>
          <p>
            Basic usage of the <code>Button</code> component, using some of the
            HTML button props it supports.
          </p>
          <p>
            <strong>Note:</strong> Click this button to update the state of the{" "}
            <code>App</code> component, which demonstrates the effect of using{" "}
            <code>memo()</code> in the section below.
          </p>
        </em>
        <Button
          type="button"
          onClick={() => {
            setCount(x => x + 1);
          }}>
          {count}
        </Button>
      </section>
      <section>
        <h2>Element types</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button>
            {({ style, ...restProps }) =>
              ifExhausted(
                restProps,
                <a
                  href="https://google.com"
                  style={style}
                  onClick={e => {
                    e.preventDefault();
                  }}>
                  anchor
                </a>,
              )
            }
          </Button>
          <Button>
            {({ style, ...restProps }) =>
              ifExhausted(
                restProps,
                <input
                  type="text"
                  style={style}
                  value="text input"
                  onChange={() => {}}
                />,
              )
            }
          </Button>
        </div>
      </section>
      <section>
        <h2>
          with <code>memo()</code> vs. without
        </h2>
        <p>
          <em>
            <strong>Note:</strong> Click the counter button in the "Basic"
            section above to trigger state changes. Then review each render
            count shown below.
          </em>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button>
            {useMemo(
              () =>
                memo(
                  ({ style, ...restProps }) =>
                    ifExhausted(
                      restProps,
                      <div style={style}>render count: {++renders1}</div>,
                    ),
                  deepEqual,
                ),
              [],
            )}
          </Button>
          <Button>
            {({ style, ...restProps }) =>
              ifExhausted(
                restProps,
                <div style={style}>render count: {++renders2}</div>,
              )
            }
          </Button>
        </div>
      </section>
      <section>
        <h2>Errors</h2>

        <p>
          <em>See code editor for details.</em>
        </p>

        {/* Error: The `type` property must be set on the child element instead.
            Since this requires the child to be a button anyway, note that
            polymorphism may not be useful here.
        */}
        <Button type="submit">
          {({ style, ...restProps }) =>
            ifExhausted(restProps, <div style={style}>Oops</div>)
          }
        </Button>

        {/* Error: The `style` prop is not used, almost certainly an error since
            the `Button` component's visual styling is not applied.
        */}
        <Button>
          {({ style, ...restProps }) => ifExhausted(restProps, <div>Oops</div>)}
        </Button>

        {/* Error: `restProps` has not been fully destructured, almost certainly
            an error because it indicates that some of the props specified by
            the `Button` component aren't attached to the child element as
            required.
        */}
        <Button>
          {({ ...restProps }) => ifExhausted(restProps, <div>Oops</div>)}
        </Button>
      </section>
    </div>
  );
}

/**
 * Determines whether a value is iterable.
 *
 * @remarks
 * This is used to detect a fragment.
 */
function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x;
}

/**
 * Determines whether a value is a render function.
 */
function isRenderFunction<P>(
  x: ComponentType<P> | ReactNode,
): x is ComponentType<P> {
  return (
    typeof x === "function" ||
    (!!x && typeof x === "object" && !isValidElement(x) && !isIterable(x))
  );
}

/**
 * Given the first argument of `{}`, an empty object, returns the second
 * argument. When the first argument is not `{}`, produces a type error.
 *
 * @remarks
 * This is useful for ensuring that all props have been destructured. All of the
 * props must be added to the child element, or else ESLint will produce a
 * `@typescript-eslint/no-unused-vars` error. The result is effectively the same
 * as spreading the props, e.g. `<Child {...props} />`, except that it is
 * type-safe, preventing excess/invalid props from being passed to the `Child`
 * component. See https://github.com/microsoft/TypeScript/issues/29883 for
 * background on the issue.
 */
function ifExhausted<T, U>(x: F.Exact<T, {}>, u: U): U {
  return u;
}
