export namespace CSSUtils {
  export function isPropertySupported(property: keyof CSSStyleDeclaration, value: string): boolean {
    // Thanks Modernizr!
    const prop = property + ':';
    const el = document.createElement('test');
    const mStyle = el.style;

    mStyle.cssText = prop + value;

    return !!mStyle[property];
  }
}
