import { ComponentPropsWithoutRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import demoButtonStyle from "./demoButtonStyle";

export type Props = ComponentPropsWithoutRef<"button"> & { asChild?: boolean };

export default function AsChildButton({
  asChild,
  style,
  ...restPropsYeehaw
}: Props) {
  const Component = asChild ? Slot : "button";
  return (
    <Component {...restPropsYeehaw} style={{ ...style, ...demoButtonStyle }} />
  );
}
