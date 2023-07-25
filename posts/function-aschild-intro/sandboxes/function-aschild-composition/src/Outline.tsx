import { ComponentProps, CSSProperties, ReactElement, forwardRef } from "react";
import { O, U } from "ts-toolbelt";
import * as palette from "./palette";

export type ForwardProps = {
  style?: CSSProperties;
};

export type Props = U.Strict<
  (
    | ComponentProps<"span">
    | { children: (forwardProps: ForwardProps) => ReactElement }
  ) & {
    color: keyof typeof palette;
  }
>;

export default forwardRef<HTMLSpanElement, O.Omit<Props, "ref">>(
  function Outline({ children, color, style, ...restProps }, ref) {
    const forwardProps: ForwardProps = {
      style: {
        boxShadow: `inset 0 0 0 2px #000, 0 0 0 2px ${color}`,
        display: "inline-block",
        padding: 2,
        margin: 2,
        ...style,
      },
    };

    return typeof children === "function" ? (
      children(forwardProps)
    ) : (
      <span {...forwardProps} {...restProps} ref={ref}>
        {children}
      </span>
    );
  },
);
