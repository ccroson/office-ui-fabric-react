export namespace CSSUtils {
    export function isPropertySupported(property: string, value: string): boolean {
        // Thanks Modernizr!
        let prop = property + ':';
        let el = document.createElement('test');
        let mStyle = el.style;

        mStyle.cssText = prop + value;

        return !!mStyle[property];
    }
}