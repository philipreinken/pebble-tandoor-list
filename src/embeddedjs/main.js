import Logger from "./logger";
import Constants from "./constants";

import { } from "piu/MC";
import Message from "pebble/message";
import Button from "pebble/button";

const log = new Logger('WTCH');

log.info('init');

const backgroundSkin = new Skin({ fill: "silver" });
const headerSkin = new Skin({ fill: "white" });
const headerStyle = new Style({ font: "bold 18px Gothic", color: "black" });
const listStyle = new Style({ font: "bold 24px Gothic", horizontal: "left", color: "black" });
const paleListStyle = new Style({ font: "bold 24px Gothic", horizontal: "left", color: "gray" });
const selectedListStyle = new Style({ font: "bold 24px Gothic", horizontal: "left", color: "red" });

const LIST_ITEM_HEIGHT = 30;

class ListItemBehaviour extends Behavior {
  onCreate(subject, data) {
    this.$ = subject;
    this.item = data;

    this.onItemChecked(this.$, this.item.id, this.item.checked);
  }

  onSelectionChanged(subject, id) {
    if (this.item.id === id) {
      this.$.style = selectedListStyle;
    } else if (this.item.checked) {
      this.$.style = paleListStyle;
    } else {
      this.$.style = listStyle;
    }
  }

  onItemChecked(subject, id, checked) {
    if (this.item.id === id) {
      this.item.checked = checked;
    }

    this.$.style = (this.item.checked) ? paleListStyle : listStyle;
    this.$.string = `${(this.item.checked ? '[x]' : '[  ]')} ${this.item.name}`;
  }

  onListItemWaiting(subject, id) {
    if (this.item.id === id) {
      this.$.string = `  ${this.$.string}`;
    }
  }
}

const ListItem = Label.template($ => ({
  left: 0, right: 0, height: LIST_ITEM_HEIGHT,
  name: `item-${$.id}`,
  Behavior: ListItemBehaviour
}));

class ShoppingListBehaviour extends Behavior {
  onCreate(scroller, data) {
    this.scroller = scroller;
    this.column = scroller.first;
    this.selected = null;
  }

  getItem(id) {
    return this.column.content(`item-${id}`);
  }

  selectItem(id) {
    this.selected = id;

    this.scroller.distribute('onSelectionChanged', id);
  }

  onShoppingListItemReceived(subject, item) {
    log.info('onShoppingListItemReceived', subject, item);

    const loadingIndicator = this.column.content('loading-indicator');
    const listItem = this.getItem(item.id);

    if (loadingIndicator) {
      this.column.remove(loadingIndicator);
    }

    if (listItem) {
      log.info('item present already', listItem);

      this.column.distribute('onItemChecked', item.id, item.checked);
    } else {
      this.column.add(ListItem(item));
    }

    if (this.column.length < 2) {
      this.selectItem(item.id);
    } else if (this.selected) {
      this.scroller.distribute('onSelectionChanged', this.selected);
    }
  }

  onUpButton(subject) {
    log.info('onUpButton');

    const item = this.getItem(this.selected);

    if (item && item.previous) {
      this.selectItem(item.previous.behavior.item.id);
    }
  }

  onDownButton(subject) {
    log.info('onDownButton');

    const item = this.getItem(this.selected);

    if (item && item.next) {
      this.selectItem(item.next.behavior.item.id);
    }
  }

  onSelectButton(subject) {
    log.info('onSelectButton');

    const listItem = this.getItem(this.selected);

    if (!listItem) {
      return;
    }

    const item = listItem.behavior.item;

    item.checked = !item.checked;

    const msg = [Constants.MSG_KEY_SHOPPING_LIST_ITEM, JSON.stringify(item)];

    log.info('checking', msg);

    message.write(new Map([msg]));

    this.column.distribute('onListItemWaiting', item.id);
  }

  onSelectionChanged() {
    let listItem = this.getItem(this.selected);

    if (!listItem) {
      return;
    }

    this.scroller.scrollTo(0, listItem.bounds.y);
  }
}

const application = new Application(null, {
  skin: backgroundSkin,
  contents: [
    new Container(null, {
      top: 0, bottom: 0, left: 6, right: 6,
      contents: [
        new Scroller(null, {
          Behavior: ShoppingListBehaviour,
          left: 0, right: 0, top: 0, bottom: 0,
          active: true,
          backgroundTouch: true,
          clip: true,
          contents: [
            new Column(null, {
              top: 0, left: 0, right: 0,
              contents: [
                new Label(null, {
                  left: 0, right: 0, height: LIST_ITEM_HEIGHT,
                  name: `loading-indicator`,
                  style: listStyle,
                  string: `Loading...`
                })
              ]
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

    application.distribute((down > 0) ? 'onSelectButton' : 'onSelectButtonUp');
  },
  up: function (down) {
    log.info('handling button', down);

    application.distribute((down > 0) ? 'onUpButton' : 'onUpButtonUp');
  },
  down: function (down) {
    log.info('handling button', down);

    application.distribute((down > 0) ? 'onDownButton' : 'onDownButtonUp');
  },
  back: function (down) {
    log.info('handling button', down);

    application.distribute((down > 0) ? 'onBackButton' : 'onBackButtonUp');
  }
}

const message = new Message({
  keys: [Constants.MSG_KEY_BASE_URL, Constants.MSG_KEY_API_TOKEN, Constants.MSG_KEY_SHOPPING_LIST, Constants.MSG_KEY_SHOPPING_LIST_ITEM, Constants.MSG_KEY_SHOPPING_LIST_ITEM_CHECKED],
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
