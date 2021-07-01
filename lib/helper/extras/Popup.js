/**
 * Class to handle the interaction with the Dialog (Popup) Class from Puppeteer
 */
class Popup {
  constructor(popup, defaultAction) {
    this._popup = popup || null;
    this._actionType = '';
    this._defaultAction = defaultAction || '';
  }

  _assertValidActionType(action) {
    if (['accept', 'cancel'].indexOf(action) === -1) {
      throw new Error('Invalid Popup action type. Only "accept" or "cancel" actions are accepted');
    }
  }

  set defaultAction(action) {
    this._assertValidActionType(action);
    this._defaultAction = action;
  }

  get defaultAction() {
    return this._defaultAction;
  }

  get popup() {
    return this._popup;
  }

  set popup(popup) {
    if (this._popup) {
      console.error('Popup already exists and was not closed. Popups must always be closed by calling either I.acceptPopup() or I.cancelPopup()');
    }
    this._popup = popup;
  }

  get actionType() {
    return this._actionType;
  }

  set actionType(action) {
    this._assertValidActionType(action);
    this._actionType = action;
  }

  clear() {
    this._popup = null;
    this._actionType = '';
  }

  assertPopupVisible() {
    if (!this._popup) {
      throw new Error('There is no Popup visible');
    }
  }

  assertPopupActionType(type) {
    this.assertPopupVisible();
    const expectedAction = this._actionType || this._defaultAction;
    if (expectedAction !== type) {
      throw new Error(`Popup action does not fit the expected action type. Expected popup action to be '${expectedAction}' not '${type}`);
    }
    this.clear();
  }
}

module.exports = Popup;
