import Message from "pebble/message";
import Button from "pebble/button";

import WatchApplication from "./app";
import { BuildMessageHandler, BuildButtonHandler } from "./handler";

const application = new WatchApplication();

const messageHandler = BuildMessageHandler(application, null);

const appMessage = new Message({
  keys: [ ...messageHandler.events() ],
  onReadable() {
    const msg = this.read();

    msg.forEach((value, key) => {
      messageHandler.call(key, value);
    });
  }
});

const buttonHandler = BuildButtonHandler(application, appMessage);

const appButton = new Button({
  types: [...buttonHandler.events()],
  onPush(down, type) {
    buttonHandler.call(type, down);
  }
});

export default application;
