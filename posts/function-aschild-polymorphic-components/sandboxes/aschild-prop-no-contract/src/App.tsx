import "./global.css";

import { ReactElement, ReactNode, useState } from "react";
import { Slot } from "@radix-ui/react-slot";
import { U } from "ts-toolbelt";

/**
 * {@link Button} component props
 *
 * @remarks
 * Nowhere in this type definition is the interface between the parent and child
 * described. The `Button` component can forward any set of props to the child.
 * At the same time, it has no guarantee that the child actually does anything
 * with those props.
 */
type ButtonProps = U.Strict<
  | { asChild: true; children: ReactElement }
  | { asChild?: false; children?: ReactNode }
>;

/**
 * A trivial polymorphic button component that provides basic visual styling and
 * a hover effect for demo purposes
 *
 * @remarks
 * Try to imagine what it would be like to use this `Button` component without
 * any knowledge of its internal implementation details.
 */
function Button({ asChild, children }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  const [hover, setHover] = useState(false);
  return (
    <Component
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      style={{
        display: "inline-block",
        fontFamily: "sans-serif",
        margin: 0,
        padding: "1em 2em",
        textDecoration: "none",
        background: hover ? "#559" : "#336",
        color: "#fff",
      }}>
      {children}
    </Component>
  );
}

/**
 * {@link Link} component props
 *
 * @remarks
 * The commented-out props are required for this component to work as the
 * `asChild` child of the {@link Button} component, but the only way to
 * know this is to be familiar with the implementation details of that
 * component.
 */
type LinkProps = {
  href: string;
  children?: ReactNode;
  // style?: CSSProperties;
  // onMouseEnter?: () => void;
  // onMouseLeave: () => void;
};

/**
 * A very limited link component, basically a wrapper around the HTML `a` tag
 * used for demo purposes.
 *
 * @remarks
 * The commented-out props are required for this component to work as the
 * `asChild` child of the {@link Button} component, but the only way to
 * know this is to be familiar with the implementation details of that
 * component.
 */
function Link({
  href,
  children,
}: // style,
// onMouseEnter,
// onMouseLeave
LinkProps) {
  return (
    <a
      href={href}
      // style={style}
      // onMouseEnter={onMouseEnter}
      // onMouseLeave={onMouseLeave}
    >
      {children}
    </a>
  );
}

export default function App() {
  return (
    <div style={{ display: "inline-flex", gap: 16, alignItems: "center" }}>
      <Button asChild>
        <a href="https://react.dev">
          Standard <code>&lt;a&gt;</code> element
        </a>
      </Button>
      <Button asChild>
        <Link href="https://react.dev">
          Custom <code>&lt;Link&gt;</code> element
        </Link>
      </Button>
    </div>
  );
}
