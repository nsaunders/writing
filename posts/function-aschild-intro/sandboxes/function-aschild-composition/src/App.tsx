/* eslint @typescript-eslint/no-unused-vars:error */

import { exhausted } from "./util";
import Outline from "./Outline";
import Highlight from "./Highlight";
import Text from "./Text";

function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "flex-start",
      }}>
      <Outline color="yellow">Outline</Outline>
      <Highlight color="yellow">Highlight</Highlight>
      <Text variant="base">Text (base)</Text>
      <Text variant="large">Text (large)</Text>
      <Outline color="yellow">
        {({ style: outlineStyle, ...restProps }) =>
          exhausted(restProps) && (
            <Highlight color="yellow">
              {({ style: highlightStyle, ...restProps }) =>
                exhausted(restProps) && (
                  <Text
                    variant="base"
                    style={{ ...outlineStyle, ...highlightStyle }}>
                    Outline + Highlight + Text (base)
                  </Text>
                )
              }
            </Highlight>
          )
        }
      </Outline>
      <Outline color="blue">
        {({ style: outlineStyle, ...restProps }) =>
          exhausted(restProps) && (
            <Highlight color="pink">
              {({ style: highlightStyle, ...restProps }) =>
                exhausted(restProps) && (
                  <Text variant="large">
                    {({ style: textStyle, ...restProps }) =>
                      exhausted(restProps) && (
                        <button
                          onClick={() => {
                            alert("button click callback");
                          }}
                          style={{
                            ...outlineStyle,
                            ...highlightStyle,
                            ...textStyle,
                          }}>
                          button
                        </button>
                      )
                    }
                  </Text>
                )
              }
            </Highlight>
          )
        }
      </Outline>
    </div>
  );
}

export default App;
