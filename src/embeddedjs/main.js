import Poco from "commodetto/Poco";
import Message from "pebble/message";

const render = new Poco(screen);
const font = new render.Font("Gothic-Regular", 14);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const gray = render.makeColor(170, 170, 170);
const green = render.makeColor(0, 170, 0);

let entries = [];
let selectedIndex = 0;
let statusText = "Starting...";

const MAX_VISIBLE = 4;
const ROW_HEIGHT = 36;
const TOP_OFFSET = 48;

function safeString(v) {
  if (v === undefined || v === null) return "";
  return String(v);
}

function draw() {
  render.begin();
  render.fillRectangle(black, 0, 0, render.width, render.height);
  render.drawText("Tandoor Shopping", font, white, 4, 4);
  render.drawText(statusText, font, gray, 4, 24);

  if (entries.length === 0) {
    render.drawText("No entries", font, gray, 4, 44);
  } else {
    let start = Math.max(0, Math.min(selectedIndex, entries.length - MAX_VISIBLE));
    let end = Math.min(start + MAX_VISIBLE, entries.length);

    for (let i = start; i < end; i++) {
      let entry = entries[i];
      let y = TOP_OFFSET + (i - start) * ROW_HEIGHT;
      let isSelected = i === selectedIndex;
      let color = entry.checked ? green : white;
      let marker = entry.checked ? "[x] " : "[ ] ";
      let prefix = isSelected ? "> " : "  ";

      render.drawText(prefix + marker + entry.name, font, color, 4, y);

      let detail = (entry.amount + " " + entry.unit).trim();
      if (detail) {
        render.drawText("    " + detail, font, gray, 4, y + 16);
      }
    }
  }

  render.end();
}

function updateStatus(text) {
  statusText = text;
  draw();
}

const message = new Message({
  keys: ["type", "id", "name", "amount", "unit", "checked", "index"],
  onReadable() {
    const msg = this.read();
    let payload = {};
    msg.forEach((value, key) => {
      payload[key] = value;
    });
    handleMessage(payload);
  },
  onWritable() {
    updateStatus("Ready");
  },
  onSuspend() {
    updateStatus("Suspended");
  }
});

function sendToPhone(type, payload) {
  payload = payload || {};
  payload.type = type;
  let map = new Map();
  Object.keys(payload).forEach(k => map.set(k, payload[k]));
  message.write(map);
}

function handleMessage(payload) {
  switch (payload.type) {
    case "clear":
      entries = [];
      selectedIndex = 0;
      updateStatus("Loading...");
      break;
    case "entry":
      entries[payload.index] = {
        id: payload.id,
        name: payload.name,
        amount: safeString(payload.amount),
        unit: safeString(payload.unit),
        checked: payload.checked === 1
      };
      updateStatus("List (" + entries.length + ")");
      break;
    case "updated":
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].id === payload.id) {
          entries[i].checked = payload.checked === 1;
          break;
        }
      }
      updateStatus("Updated");
      break;
    case "error":
      updateStatus("Error: " + payload.name);
      break;
    default:
      updateStatus("Msg: " + payload.type);
      break;
  }
}

function toggleSelected() {
  let entry = entries[selectedIndex];
  if (!entry) return;

  let newChecked = !entry.checked;
  updateStatus("Toggling...");
  sendToPhone("toggle", {
    id: entry.id,
    checked: newChecked ? 1 : 0
  });
}

function setupButtons() {
  if (device && device.buttons) {
    if (device.buttons.up) {
      device.buttons.up.on("changed", () => {
        if (selectedIndex > 0) {
          selectedIndex--;
          updateStatus("List " + (selectedIndex + 1) + "/" + entries.length);
        }
      });
    }
    if (device.buttons.down) {
      device.buttons.down.on("changed", () => {
        if (selectedIndex < entries.length - 1) {
          selectedIndex++;
          updateStatus("List " + (selectedIndex + 1) + "/" + entries.length);
        }
      });
    }
    if (device.buttons.select) {
      device.buttons.select.on("changed", () => toggleSelected());
    }
  }
}

draw();
setupButtons();
updateStatus("Waiting for phone...");
