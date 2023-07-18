import "./global.css";

import AsButton from "./AsButton";
import AsChildButton from "./AsChildButton";
import demoButtonStyle from "./demoButtonStyle";

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 16,
      }}>
      <a href="https://react.dev" style={demoButtonStyle} disabled>
        Plain <code>&gt;a&gt;</code> button - type error
      </a>
      <AsButton as="a" href="https://react.dev" disabled>
        <code>as</code> button - type error
      </AsButton>
      <AsChildButton asChild>
        <a href="https://react.dev">
          <code>asChild</code> button - no error
        </a>
      </AsChildButton>
    </div>
  );
}
