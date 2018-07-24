// OneDrive:IgnoreCodeCoverage
import * as React from 'react';
import { getRTL } from '../../../Utilities';

export namespace RtlUtils {
  'use strict';

  /**
   * Cached scrollLeft type
   */
  let scrollLeftType: ScrollLeftType = undefined;

  /**
   * Get a standardized scrollLeft value from an element. This method determines the type if it needs to,
   * then returns a value in the 'Reverse' type. The current browser type is saved for subsequent calls
   * since it only changes when you change browsers.
   *
   * See ScrollLeftType enum for more info.
   *
   * @param element Element to measure scrollLeft on
   * @return Horizonal scroll value in 'Reverse' type
   */
  export function getStandardizedScrollLeftValue(element: HTMLElement): number {
    'use strict';

    if (!element) {
      return 0;
    }

    // when not in RTL, just return browser defined scrollLeft value
    if (!getRTL()) {
      return element.scrollLeft;
    }

    // if we dont have a cached scrollLeft type, then we need to figure it out
    if (!scrollLeftType) {
      scrollLeftType = determineScrollLeftType();
    }

    // use the scrollLeft value and the type to calculate the scrollLeft value in 'Reverse' type
    let browserSpecificScrollLeft: number = element.scrollLeft;
    switch (scrollLeftType) {
      case ScrollLeftType.Negative:
        return Math.abs(browserSpecificScrollLeft);
      case ScrollLeftType.Default:
        return element.scrollWidth - browserSpecificScrollLeft - element.clientWidth;
    }

    // if its already 'Reverse', then just return it
    return browserSpecificScrollLeft;
  }

  /**
   * Set the RTL safe border left on the given CSSProperties object
   * In LTR it sets border-left, in RTL it sets border-right
   * @param style The given CSS Properties to add the style to
   * @param borderWidth The border width in pixels, use null to ignore setting this
   * @param borderStyle The border style, (solid, dotted, none etc.) use null to ignore setting this
   * @param borderColor The border color as string or hash value, use null to ignore setting this
   */
  export function setRTLSafeBorderLeft(
    cssProperties: React.CSSProperties,
    borderWidth: number,
    borderStyle: string,
    borderColor: string
  ) {
    'use strict';
    if (!getRTL()) {
      setBorderLeft(cssProperties, borderWidth, borderStyle, borderColor);
    } else {
      setBorderRight(cssProperties, borderWidth, borderStyle, borderColor);
    }
  }

  /**
   * Set the RTL safe border right on the given CSSProperties object
   * In LTR it sets border-right, in RTL it sets border-left
   * @param style The given CSS Properties to add the style to
   * @param borderWidth The border width in pixels, use null to ignore setting this
   * @param borderStyle The border style, (solid, dotted, none etc.) use null to ignore setting this
   * @param borderColor The border color as string or hash value, use null to ignore setting this
   */
  export function setRTLSafeBorderRight(
    cssProperties: React.CSSProperties,
    borderWidth: number,
    borderStyle: string,
    borderColor: string
  ) {
    'use strict';
    if (!getRTL()) {
      setBorderRight(cssProperties, borderWidth, borderStyle, borderColor);
    } else {
      setBorderLeft(cssProperties, borderWidth, borderStyle, borderColor);
    }
  }

  function setBorderLeft(
    cssProperties: React.CSSProperties,
    borderWidth: number,
    borderStyle: string,
    borderColor: string
  ) {
    'use strict';
    if (cssProperties) {
      if (borderWidth) {
        cssProperties.borderLeftWidth = borderWidth;
      }

      if (borderStyle) {
        cssProperties.borderLeftStyle = borderStyle;
      }

      if (borderColor) {
        cssProperties.borderLeftColor = borderColor;
      }
    }
  }

  function setBorderRight(
    cssProperties: React.CSSProperties,
    borderWidth: number,
    borderStyle: string,
    borderColor: string
  ) {
    'use strict';
    if (cssProperties) {
      if (borderWidth) {
        cssProperties.borderRightWidth = borderWidth;
      }

      if (borderStyle) {
        cssProperties.borderRightStyle = borderStyle;
      }

      if (borderColor) {
        cssProperties.borderRightColor = borderColor;
      }
    }
  }

  function determineScrollLeftType(): ScrollLeftType {
    'use strict';

    // create a div that will scroll and add it to the body off the screen
    let scrollDiv: HTMLElement = document.createElement('div');
    scrollDiv.style.setProperty('dir', 'rtl');
    scrollDiv.style.setProperty('width', '1px');
    scrollDiv.style.setProperty('height', '1px');
    scrollDiv.style.setProperty('position', 'absolute');
    scrollDiv.style.setProperty('top', '-1000px');
    scrollDiv.style.setProperty('overflow', 'scroll');
    scrollDiv.style.setProperty('font-size', '14px');
    scrollDiv.innerText = 'ABCD';
    document.body.appendChild(scrollDiv);

    // determine scrollLeft type
    let type: ScrollLeftType = ScrollLeftType.Reverse;
    if (scrollDiv.scrollLeft > 0) {
      type = ScrollLeftType.Default;
    } else {
      scrollDiv.scrollLeft = 1;
      if (scrollDiv.scrollLeft === 0) {
        type = ScrollLeftType.Negative;
      }
    }

    // remove the div
    document.body.removeChild(scrollDiv);

    return type;
  }

  /**
   * Types of ScrollLeft behaviors in browsers
   */
  enum ScrollLeftType {
    /**
     * 'Default' behavior: Used by webkit browsers. Values are same in RTL as they are in LTR. Values go from a high
     * positive number to 0 as you scroll from right to left. The left edge of the scrollbar is measured.
     */
    Default,
    /**
     * 'Reverse' behavior: Used by IE/Edge. Values are reversed on the horizontal axis. Values go from 0 on the
     * right-most side and grow positively as you scroll left. The right edge of the scrollbar is measured.
     */
    Reverse,
    /**
     * 'Negative' behavior: Used by Firefox. Values go from 0 on the right-most side and grow negatively as you
     * scroll left. The right edge of the scrollbar is measured.
     */
    Negative
  }
}
