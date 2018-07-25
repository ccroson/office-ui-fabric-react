/* tslint:disable:no-any */
import * as React from 'react';
import * as _ from 'lodash';

// Utilities
import { Async, EventGroup, IDisposable } from '@uifabric/experiments/lib/Utilities';

/**
 * Base class for all components. Provides usage logging functionality
 */
export abstract class BaseComponent<P, S> extends React.Component<P, S> {
  // Async manager for this component
  private _async: Async;

  // Disposables to clean up in unmount
  private _disposables: IDisposable[] | null;

  // Events to register for this component
  private _events: EventGroup;

  // Memoized ref resolver collection
  private _resolves: _.Dictionary<(ref: any) => any>;

  constructor(props: P, context?: any) {
    super(props, context);
  }

  /**
   * Name of this component. It should usually exactly match the name of the class. One exception would be a component that is
   * re-used as-is (no wrapping component for each use) in multiple places on one page. In that case, the class name should be
   * appended with an underscore (_) followed by an identifying string that was passed into the props for the re-used component.
   */
  public abstract name(): string;

  /**
   * React's render() method with error logging. Deriving components should define the renderComponent() method instead of
   * overriding this so that they benefit from the error handling and logging.
   */
  public render(): JSX.Element | null {
    let result: JSX.Element | null;

    try {
      result = this.renderComponent();
    } catch (error) {
      console.error(`Error in render method of ${this.name()} component`, error);
      result = null;
    }

    return result;
  }

  /**
   * Dispose of any disposables before we unmount
   */
  public componentWillUnmount(): void {
    if (this._disposables) {
      this._disposables.forEach((disposable: IDisposable) => {
        if (disposable.dispose) {
          disposable.dispose();
        }
      });
    }

    this._disposables = null;
  }

  /**
   * Catches exceptions generated in descendant components. Unhandled exceptions will cause
   * the entire component tree to unmount.
   *
   * Is overridable by components, but by default the error will be logged and considered handled.
   * We don't want the entire component tree to unmount
   */
  public componentDidCatch(error: Error, errorInfo: any): void {
    console.error(`Component ${this.name()} caught error`, error);
  }

  /**
   * Abstract method to be overridden by derived component. This method should do everything you would normally put in
   * React's render() method.
   */
  protected abstract renderComponent(): JSX.Element;

  /**
   * Get the Async manager for this component
   * Lazy created on demand
   */
  protected get async(): Async {
    if (!this._async) {
      this._async = new Async(this);
      this.disposables.push(this._async);
    }

    return this._async;
  }

  /**
   * Get the disposables for this component
   * If you have objects of IDisposable that you want to automatically clean up when this component unmounts
   * add them here
   *
   * Lazy created on demand
   */
  protected get disposables(): IDisposable[] {
    if (!this._disposables) {
      this._disposables = [];
    }

    return this._disposables;
  }

  /**
   * Get the EventGroup for this component
   * Lazy created on demand
   */
  protected get events(): EventGroup {
    if (!this._events) {
      this._events = new EventGroup(this);
      this.disposables.push(this._events);
    }

    return this._events;
  }

  /**
   * Helper function that memoizes ref resolver functions.
   * Example usage:
   *
   * class MyComponent {
   *      public readonly contentContainer: HTMLElement;
   *
   *      ...
   *
   *      protected renderComponent(): JSX.Element {
   *          return <div ref={this.resolveRef(this, 'contentContainer')}/>;
   *      }
   *
   *      ...
   *
   *      private eventHandler(): void  {
   *          // Access the ref
   *          this._contentContainer;
   *      }
   * }
   *
   * @param refName The name of the ref to store.
   */
  protected resolveRef<T, K extends keyof T & keyof _.Dictionary<(ref: any) => any>>(
    obj: T,
    refName: K
  ): (ref: any) => any {
    if (!this._resolves) {
      this._resolves = {};
    }

    if (!this._resolves[refName]) {
      this._resolves[refName] = (ref: any) => {
        return (obj[refName] = ref);
      };
    }

    return this._resolves[refName];
  }
}
