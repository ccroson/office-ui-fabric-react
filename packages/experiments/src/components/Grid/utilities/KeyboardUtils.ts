import * as _ from 'lodash';
import * as React from 'react';

// Constants
import { KeyCode } from '../constants/KeyboardConstants';

export namespace KeyboardUtils {
  /**
   * Check if key code is a valid selection key
   * @param {KeyCode} keycode The keyboard code to be evaluated
   * @param {(keyCode: number) => number} [keycodeMapper] keycode mapper - e.g., 'ENTER' key -> 'End' key
   */
  export function keyCodeIsSelectionKey(keyCode: KeyCode, keycodeMapper?: (keyCode: number) => number): boolean {
    let selectionKeys = [KeyCode.ENTER, KeyCode.SPACE];
    if (keycodeMapper) {
      selectionKeys = _.map(selectionKeys, keycodeMapper);
    }
    return keyCodeInSet(keyCode, selectionKeys);
  }

  /**
   * Execute action if keyboard event is one of the allowed keycodes
   * @param {KeyCode[]} allowedKeyCodes The keycode(s) allowed to invoke action
   * @param {(...args: any[]) => void} action The action to invoke if key pressed was in key code set
   * @return {(ev: React.KeyboardEvent<HTMLElement>, ...args: any[]) => boolean}
   * Handler which returns true if action was called, false otherwise
   *  - ev The keyboard event that was triggered
   *  - args Arguments to be used when invoking action
   */
  export function executeWhenAllowedKeyPressed<T>(
    allowedKeyCodes: KeyCode[],
    action: (...args: T[]) => void
  ): (ev: React.KeyboardEvent<HTMLElement>, ...args: T[]) => boolean {
    return (ev: React.KeyboardEvent<HTMLElement>, ...args: T[]): boolean => {
      if (ev && keyCodeInSet(ev.keyCode, allowedKeyCodes)) {
        action(...args);
        return true;
      }
      return false;
    };
  }

  /**
   * Return true if keycode is in the set of allowed keycodes
   * @param {KeyCode} keyPressed The key code of the key pressed
   * @param {KeyCode[]} allowedKeyCodes The allowed keycode(s)
   */
  export function keyCodeInSet(keyPressed: KeyCode, allowedKeyCodes: KeyCode[]): boolean {
    return _.some(allowedKeyCodes, (keyCode: KeyCode) => {
      return keyCode === keyPressed;
    });
  }
}
