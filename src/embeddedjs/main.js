import Logger from "./logger";
import Constants from "./constants";

import { } from "piu/MC";
import Message from "pebble/message";
import Button from "pebble/button";

const log = new Logger('WTCH');

log.info('init');

const SCREEN_WIDTH = 200;
const SCREEN_HEIGHT = 228;
const LIST_ITEM_HEIGHT = 56;
const LIST_FONT = "bold 28px Gothic";
const LIST_LEFT_PADDING = 8;
const LIST_RIGHT_PADDING = 8;

const SKIN_IDX_NORMAL = 0;
const SKIN_IDX_SELECTED = 1;
const SKIN_IDX_CHECKED = 2;

const backgroundSkin = new Skin({ fill: "silver" });

const listItemSkin = new Skin({
  fill: ["white", "#00aaff", "white"] // SKIN_IDX_*
});

const listItemStyle = new Style({
  font: LIST_FONT,
  horizontal: "left",
  vertical: "middle",
  color: ["black", "black", "gray"], // SKIN_IDX_*
  left: LIST_LEFT_PADDING,
  right: LIST_RIGHT_PADDING
});

class ListItemBehaviour extends Behavior {
  onCreate(label, data) {
    this.$ = label;
    this.item = data;
    this.isSelected = false;
    this.isWaiting = false;
    this.refresh();
  }

  itemString() {
    return `${this.item.checked ? '[x] ' : '[  ] '}${this.item.name}`;
  }

  refresh() {
    const label = this.$;

    label.string = this.itemString();

    if (this.isSelected) {
      label.state = SKIN_IDX_SELECTED;
    } else {
      label.state = this.item.checked ? SKIN_IDX_CHECKED : SKIN_IDX_NORMAL;
    }

    if (this.isWaiting) {
      label.left = LIST_LEFT_PADDING * 2;
    }
  }

  onSelectionChanged(label, selectedId) {
    this.isSelected = (this.item.id === selectedId);
    this.refresh();
  }

  onItemChecked(label, id, checked) {
    if (this.item.id !== id) return;
    this.item.checked = checked;
    this.refresh();
  }

  onListItemWaiting(label, id) {
    if (this.item.id === id) {
      this.isWaiting = true;
      this.refresh();
    }
  }
}

const ListItem = Label.template($ => ({
  left: 0, right: 0,
  height: LIST_ITEM_HEIGHT,
  name: `item-${$.id}`,
  skin: listItemSkin,
  style: listItemStyle,
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
    const listItem = this.getItem(this.selected);

    if (!listItem) {
      return;
    }

    const center = listItem.bounds.y + (listItem.height / 2);
    const offset = Math.max(0, center - (this.scroller.height / 2));

    this.scroller.scrollTo(0, offset);
  }
}

const application = new Application(null, {
  skin: backgroundSkin,
  contents: [
    new Container(null, {
      top: 0, bottom: 0, left: 0, right: 0,
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
                  left: 0, right: 0,
                  height: LIST_ITEM_HEIGHT,
                  name: `loading-indicator`,
                  style: listItemStyle,
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
