import _ from './constants';
import Handler from './handler';

/**
 * @param application PiuApplication
 * @returns Handler
 */
function BuildButtonHandler(application) {
  const h = new Handler('message');

  h.register('select', function (down) {
    application.distribute((down > 0) ? _.E_ON_SELECT_BUTTON : _.E_ON_SELECT_BUTTON_UP);
  });

  h.register('up', function (down) {
    application.distribute((down > 0) ? _.E_ON_UP_BUTTON : _.E_ON_UP_BUTTON_UP);
  });

  h.register('down', function (down) {
    application.distribute((down > 0) ? _.E_ON_DOWN_BUTTON : _.E_ON_DOWN_BUTTON_UP);
  });

  h.register('back', function (down) {
    application.distribute((down > 0) ? _.E_ON_BACK_BUTTON : _.E_ON_BACK_BUTTON_UP);
  });

  return h;
}

export default BuildButtonHandler;
