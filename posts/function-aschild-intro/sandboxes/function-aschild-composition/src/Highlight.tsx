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
  function Highlight({ children, color, style, ...restProps }, ref) {
    const forwardProps: ForwardProps = {
      style: {
        background: palette[color],
        color: "#000",
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
