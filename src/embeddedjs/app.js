import _ from "./constants";
import Logger from "./logger";

import { } from "piu/MC";

const log = new Logger('WTCH');

log.info('init');

const backgroundSkin = new Skin({ fill: "silver" });
const listItemSkin = new Skin({
  fill: ["white", "#00aaff", "white", "gray"] // SKIN_IDX_*
});

const listItemStyle = new Style({
  font: _.LIST_FONT,
  horizontal: "left",
  vertical: "middle",
  color: ["black", "black", "gray", "black"], // SKIN_IDX_*
  left: _.LIST_LEFT_PADDING,
  right: _.LIST_RIGHT_PADDING
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

    if (this.isWaiting) {
      label.state = _.SKIN_IDX_WAITING;
    } else {
      if (this.isSelected) {
        label.state = _.SKIN_IDX_SELECTED;
      } else {
        label.state = this.item.checked ? _.SKIN_IDX_CHECKED : _.SKIN_IDX_NORMAL;
      }
    }
  }

  onSelectionChanged(label, selectedId) {
    this.isSelected = (this.item.id === selectedId);

    this.refresh();
  }

  onItemUpdateReceived(label, item) {
    if (this.item.id === item.id) {
      this.item = item;
      this.isWaiting = false;

      this.refresh();
    }
  }

  onListItemWaiting(label, id) {
    if (this.item.id === id) {
      this.isWaiting = true;

      this.refresh();
    }
  }
}

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

  [_.E_ON_SHOPPING_LIST_ITEM_RECEIVED](subject, item) {
    log.info('shoppingListItemReceived', subject, item);

    const loadingIndicator = this.column.content('loading-indicator');
    const listItem = this.getItem(item.id);

    if (loadingIndicator) {
      this.column.remove(loadingIndicator);
    }

    if (listItem) {
      log.info('item present already', listItem);

      this.column.distribute('onItemUpdateReceived', item);
    } else if (!item.checked) {
      this.column.add(ListItem(item));

      if (this.column.length < 2) {
        this.selectItem(item.id);
      }
    }
  }

  [_.E_ON_UP_BUTTON](subject) {
    log.info('onUpButton');

    const item = this.getItem(this.selected);

    if (item && item.previous) {
      this.selectItem(item.previous.behavior.item.id);
    }
  }

  [_.E_ON_DOWN_BUTTON](subject) {
    log.info('onDownButton');

    const item = this.getItem(this.selected);

    if (item && item.next) {
      this.selectItem(item.next.behavior.item.id);
    }
  }

  [_.E_ON_SELECT_BUTTON](subject) {
    log.info('onSelectButton');

    const listItem = this.getItem(this.selected);

    if (!listItem) {
      return;
    }

    const item = Object.assign({}, listItem.behavior.item);

    item.checked = !item.checked;

    const msg = [_.MSG_KEY_SHOPPING_LIST_ITEM, JSON.stringify(item)];

    log.info('checking', msg);

    message.write(new Map([msg]));

    this.column.distribute('onListItemWaiting', item.id);
  }

  onSelectionChanged() {
    const listItem = this.getItem(this.selected);
    if (!listItem) return;

    const center = listItem.offset.y + (listItem.height / 2);
    const desired = center - (this.scroller.height / 2);
    const max = Math.max(0, this.column.height - this.scroller.height);

    this.scroller.scrollTo(0, Math.max(0, Math.min(desired, max)));
  }
}

const ListItem = Label.template($ => ({
  left: 0, right: 0,
  height: _.LIST_ITEM_HEIGHT,
  name: `item-${$.id}`,
  skin: listItemSkin,
  style: listItemStyle,
  Behavior: ListItemBehaviour
}));

const WatchApplication = Application.template($ => ({
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
                  height: _.LIST_ITEM_HEIGHT,
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
}));

export default WatchApplication;
