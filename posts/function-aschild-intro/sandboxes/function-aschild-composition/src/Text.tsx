import { ComponentProps, CSSProperties, ReactElement, forwardRef } from "react";
import { O, U } from "ts-toolbelt";

export type ForwardProps = {
  style?: CSSProperties;
};

export type Props = U.Strict<
  (
    | ComponentProps<"span">
    | { children: (forwardProps: ForwardProps) => ReactElement }
  ) & {
    variant: "base" | "large";
  }
>;

export default forwardRef<HTMLSpanElement, O.Omit<Props, "ref">>(function Text(
  { children, style, variant = "base", ...restProps },
  ref,
) {
  const forwardProps: ForwardProps = {
    style: {
      fontFamily: "sans-serif",
      fontSize: variant === "large" ? "2rem" : "1rem",
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
});
