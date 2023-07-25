import { ComponentProps, ComponentType, ReactElement, forwardRef } from "react";
import { O, U } from "ts-toolbelt";
import cx from "clsx";

export type ForwardProps = {
  className?: string;
  disabled?: boolean;
};

export type Props = U.Strict<
  (
    | ComponentProps<"button">
    | { children: (forwardProps: ForwardProps) => ReactElement }
  ) & {
    disabled?: boolean;
    variant?:
      | "primary"
      | "secondary"
      | "success"
      | "danger"
      | "warning"
      | "info"
      | "light"
      | "dark";
    size?: "small" | "medium" | "large";
  }
>;

export default forwardRef<HTMLButtonElement, O.Omit<Props, "ref">>(
  function Button(
    {
      children,
      className,
      disabled,
      size = "medium",
      variant = "secondary",
      ...restProps
    },
    ref,
  ) {
    const forwardProps: ForwardProps = {
      className: cx(
        className,
        "btn",
        `btn-${variant}`,
        `btn-${{ small: "sm", medium: "md", large: "lg" }[size]}`,
        disabled && "disabled",
      ),
      disabled,
    };

    return typeof children === "function" ? (
      children(forwardProps)
    ) : (
      <button {...forwardProps} {...restProps} ref={ref}>
        {children}
      </button>
    );
  },
) as ComponentType<Props>;
