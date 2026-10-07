import Logger from "./logger";
import Constants from "./constants";

import { } from "piu/MC";
import Message from "pebble/message";
import Button from "pebble/button";

const log = new Logger('WTCH');

log.info('init');

log.info(Constants);

const BUTTON_ID = {
  UP: 0,
  DOWN: 1,
  SELECT: 2,
  BACK: 3
};

const backgroundSkin = new Skin({ fill: "silver" });
const headerSkin = new Skin({ fill: "white" });
const headerStyle = new Style({ font: "bold 18px Gothic", color: "black" });
const listStyle = new Style({ font: "bold 14px Gothic", horizontal: "left", color: "black" });
const paleListStyle = new Style({ font: "bold 14px Gothic", horizontal: "left", color: "gray" });
const selectedListStyle = new Style({ font: "bold 14px Gothic", horizontal: "left", color: "red" });

class ShoppingListBehaviour extends Behavior {
  onCreate() {
    this.items = new Map();
    this.selected = "";
  }

  onShoppingListItemReceived(subject, item) {
    log.info('onShoppingListItemReceived', subject, item);

    this.items.set(item.id, item);

    if (this.items.size < 2) {
      this.selected = item.id;
    }

    this.updateBlocks(subject);
  }

  onUpButton(subject) {
    log.info('onUpButton');

    const neighbours = this.neighbours(this.selected);

    if (neighbours.previous) {
      this.selected = neighbours.previous.key;
      this.updateBlocks(subject);
    }
  }

  onDownButton(subject) {
    log.info('onDownButton');

    const neighbours = this.neighbours(this.selected);

    if (neighbours.next) {
      this.selected = neighbours.next.key;
      this.updateBlocks(subject);
    }
  }

  neighbours(key) {
    const keys = [...this.items.keys()];
    const i = keys.indexOf(key);
    if (i === -1) return { previous: undefined, next: undefined };

    return {
      previous: i > 0
        ? { key: keys[i - 1], value: this.items.get(keys[i - 1]) }
        : undefined,
      next: i < keys.length - 1
        ? { key: keys[i + 1], value: this.items.get(keys[i + 1]) }
        : undefined,
    };
  }


  renderBlock(item) {
    const ret = {
      spans: `${item.checked ? '[x]' : '[  ]'} ${item.name}`
    };

    if (item.checked) {
      ret.style = paleListStyle;
    }

    if (this.selected === item.id) {
      ret.style = selectedListStyle;
    }

    return ret;
  }

  renderBlocks(items) {
    return items.map(this.renderBlock.bind(this));
  }

  updateBlocks(subject) {
    const items = [...this.items.values()];

    log.info('updating list', items);

    subject.blocks = this.renderBlocks(items);
  }
}

const application = new Application(null, {
  skin: backgroundSkin,
  contents: [
    new Container(null, {
        top: 0, bottom: 0, left: 0, right: 0,
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
                blocks: [],
                Behavior: ShoppingListBehaviour
              })
            ]
          })
        ]
    })
  ]
});

const messageHandlers = {
  [Constants.MSG_KEY_SHOPPING_LIST_ITEM]: function (item) {
    log.info('handling message', item);

    application.distribute('onShoppingListItemReceived', JSON.parse(item))
  }
}

const buttonHandlers = {
  select: function (down) {
    log.info('handling button', down);

    application.distribute(down ? 'onSelectButton' : 'onSelectButtonUp');
  },
  up: function (down) {
    log.info('handling button', down);

    application.distribute(down ? 'onUpButton' : 'onUpButtonUp');
  },
  down: function (down) {
    log.info('handling button', down);

    application.distribute(down ? 'onDownButton' : 'onDownButtonUp');
  },
  back: function (down) {
    log.info('handling button', down);

    application.distribute(down ? 'onBackButton' : 'onBackButtonUp');
  }
}

const message = new Message({
  keys: [Constants.MSG_KEY_BASE_URL, Constants.MSG_KEY_API_TOKEN, Constants.MSG_KEY_SHOPPING_LIST, Constants.MSG_KEY_SHOPPING_LIST_ITEM],
  onReadable() {
    const msg = this.read();
    msg.forEach((value, key) => {
      log.info('received', key, value);

      if (typeof messageHandlers[key] === 'function') {
        messageHandlers[key](value);
      }
    });
  },
  onWritable() {
    log.info("on writable");
  },
  onSuspend() {
    log.info("Messages suspended");
  }
});

new Button({
    types: ["select", "up", "down", "back"],
    onPush(down, type) {
      if (typeof buttonHandlers[type] === 'function') {
        buttonHandlers[type](down);
      }
    }
});

export default application;
