# electron-simple-toast
*Simple toast notifications for Electron apps*

# Installation
`npm install electron-simple-toast`

# Usage

```JavaScript
const toast = require("electron-simple-toast");

// Change default properties
toast.setConfig({
    width: 300,
    height: 80
});

//Create predefined success, warning, error or info toasts
toast.success("Success", "Hello there", 5000);

toast.warning("Warning", "It's a trap!", 5000);

toast.error("Error", "That's not how the Force works!", 5000);

toast.info("Info", "These are not the droids you're looking for", 5000);

//Create custom toasts
toast.create({
    title: "Custom",
    message: "Aren't you a little short for a stormtrooper?",
    icon: path.join(__dirname, "typing.png"),
    background: "#9b59b6",
    duration: 7000,
    color: "#ecf0f1"
});
```

# Config

If `targetWindow` is specified with a `BrowserWindow`, toast notifications will be created on the same display as the specified window. Otherwise, toasts will be created on the main display.
```JavaScript
{
    targetWindow: null,
    width: 300,
    height: 80,
    style: {
        fontSize: 17,
        iconSize: 50
    },
    padding: {
        x: 40,
        y: 30
    }
}
```
