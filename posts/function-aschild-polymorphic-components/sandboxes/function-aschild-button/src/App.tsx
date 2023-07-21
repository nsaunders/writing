/* eslint @typescript-eslint/no-unused-vars:error */

import { exhausted } from "./util";
import Button from "./Button";

function App() {
  return (
    <div style={{ display: "flex", gap: 8, margin: 16 }}>
      <form
        style={{ display: "contents" }}
        onSubmit={() => {
          alert("form onSubmit callback");
        }}>
        <Button type="submit" variant="primary">
          Submit
        </Button>
        <Button variant="secondary" disabled>
          {({ className, disabled, ...restProps }) =>
            exhausted(restProps) && (
              <a
                href="#/home"
                className={className}
                aria-disabled={disabled}
                onClick={e => {
                  if (disabled) e.preventDefault();
                }}>
                Cancel
              </a>
            )
          }
        </Button>
      </form>
    </div>
  );
}

export default App;
