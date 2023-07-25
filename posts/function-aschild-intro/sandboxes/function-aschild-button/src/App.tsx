/* eslint @typescript-eslint/no-unused-vars:error */

import { exhausted } from "./util";
import Button from "./Button";

function App() {
  return (
    <form
      style={{ display: "flex", gap: 8, margin: 16 }}
      onSubmit={e => {
        alert("form submit callback");
        e.preventDefault();
      }}>
      <Button type="submit" variant="primary">
        Submit
      </Button>
      <Button variant="secondary">
        {({ className, disabled, ...restProps }) =>
          exhausted(restProps) && (
            <a
              href="#/home"
              className={className}
              aria-disabled={disabled}
              onClick={e => {
                e.preventDefault();
                if (!disabled) {
                  alert("anchor click callback");
                }
              }}>
              Cancel
            </a>
          )
        }
      </Button>
    </form>
  );
}

export default App;
