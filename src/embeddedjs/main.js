import Logger from "./logger";
import Constants from "./constants";

import { } from "piu/MC";
import Message from "pebble/message";

const log = new Logger('WTCH');

log.info('init');

log.info(JSON.stringify(Constants));

const backgroundSkin = new Skin({ fill: "silver" });
const headerSkin = new Skin({ fill: "white" });
const headerStyle = new Style({ font: "bold 18px Gothic", color: "black" });
const listStyle = new Style({ font: "bold 14px Gothic", color: "black" });

const message = new Message({
  keys: [Constants.MSG_KEY_SHOPPING_LIST],
  onReadable() {
    const msg = this.read();
    msg.forEach((value, key) => {
        log.info(key + ": " + value);
    });
  },
  onWritable() {
    log.info("on writable");
		if (this.once)
 			return;

		this.once = true;
    const m = new Map;
		m.set("COUNTER", 1000);

    this.write(m);

		log.info("wrote!");
  },
  onSuspend() {
    log.info("Messages suspended");
  }
});

const application = new Application(null, {
  skin: backgroundSkin,
  contents: [
    new Column(null, {
      top: 0, bottom: 0, left: 0, right: 0,
      contents: [
        new Label(null, {
          top: 0, height: 30, left: 0, right: 0,
         skin: headerSkin,
          style: headerStyle,
          string: "Tandoor Shopping List"
        }),
        new Text(null, {
          top: 10, bottom: 10, left: 10, right: 10,
          style: listStyle,
          blocks: [
            { spans: `Loading...` }
          ]
        })
      ]
    })
  ]
});

export default application;
