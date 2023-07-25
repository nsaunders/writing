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
        disabled <code>&lt;a&gt;</code> (plain) - type error
      </a>
      <AsButton as="a" href="https://react.dev" disabled>
        disabled <code>&lt;a&gt;</code> (via <code>as</code> prop) - type error
      </AsButton>
      <AsChildButton asChild disabled>
        <a href="https://react.dev">
          disabled <code>&lt;a&gt;</code> (via <code>asChild</code> prop) - no
          type error
        </a>
      </AsChildButton>
    </div>
  );
}
