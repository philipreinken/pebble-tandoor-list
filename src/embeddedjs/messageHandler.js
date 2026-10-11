import _ from "./constants";
import Handler from './handler';

/**
 * @param application PiuApplication
 * @returns Handler
 */
function BuildMessageHandler(application) {
  const h = new Handler('message');

  for (const e of [_.MSG_KEY_BASE_URL, _.MSG_KEY_API_TOKEN, _.MSG_KEY_SHOPPING_LIST, _.MSG_KEY_SHOPPING_LIST_ITEM, _.MSG_KEY_SHOPPING_LIST_ITEM_CHECKED]) {
    h.register(e, null);
  }

  h.register(_.MSG_KEY_SHOPPING_LIST_ITEM, function (item) {
    application.distribute(_.E_ON_SHOPPING_LIST_ITEM_RECEIVED, JSON.parse(item))
  });

  return h;
}

export default BuildMessageHandler;
