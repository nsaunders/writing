import { PolymorphicComponent } from "react-polymorphed";
import demoButtonStyle from "./demoButtonStyle";

const AsButton: PolymorphicComponent<"button", {}> = function AsButton({
  as: As = "button",
  style,
  ...restProps
}) {
  return <As {...restProps} style={{ ...style, ...demoButtonStyle }} />;
};

export default AsButton;
