In recent years, frontend developers have been rethinking traditional CSS "best
practices", which are redundant (counterproductive even) under component-based
architecture (like React). Heavy-handed tools like CSS-in-JS and Atomic CSS
reinvented inline styles because we wanted local reasoning but still needed CSS
features for hover and focus effects, responsive design, etc. With CSS Hooks,
these workarounds are no longer necessary: We can just use the `style` prop.
