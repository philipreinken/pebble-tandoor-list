import Message from "pebble/message";
import Button from "pebble/button";

import WatchApplication from "./app";
import BuildMessageHandler from "./messageHandler";
import BuildButtonHandler from "./buttonHandler";

const application = new WatchApplication({}, {});

const messageHandler = BuildMessageHandler(application);
const buttonHandler = BuildButtonHandler(application);

new Message({
  keys: [ ...messageHandler.events() ],
  onReadable() {
    const msg = this.read();

    msg.forEach((value, key) => {
      messageHandler.call(key, value);
    });
  }
});

new Button({
  types: [...buttonHandler.events()],
  onPush(down, type) {
    buttonHandler.call(type, down);
  }
});

export default application;
