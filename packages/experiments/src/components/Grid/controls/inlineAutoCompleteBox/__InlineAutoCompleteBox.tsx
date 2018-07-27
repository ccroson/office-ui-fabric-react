/*tslint:disable:class-name*/
import './InlineAutoCompleteBox.scss';
import * as React from 'react';

// utilities
import { autobind } from '../../../../../../utilities/lib-commonjs/autobind';

/**
 * The props for __InlineAutoCompleteBox
 */
export interface IInlineAutoCompleteBoxProps {
    /**
     * The delegate to be called when the value has been updated by the user
     * @param updatedValue The updated value
     */
    onChange: (updatedValue: string) => void;

    /**
     * The value to display in the editor
     */
    value: string;

    /**
     * The suggested value to display
     */
    suggestedValue: string;
}

/**
 * The state of the __InlineAutoCompleteBox
 */
export interface IInlineAutoCompleteBoxState {
}

/**
 * The control to be used as a inline auto complete box in the Grid.
 * Not to be consumed outside of Grid
 */
export class __InlineAutoCompleteBox extends React.PureComponent<IInlineAutoCompleteBoxProps, IInlineAutoCompleteBoxState> {
    public readonly callout: HTMLElement;
    constructor(props: IInlineAutoCompleteBoxProps, context?: any) {
        super(props, context);
    }

    /**
     * Name of the component
     */
    public name(): string {
        return '__InlineAutoCompleteBox';
    }

    /**
     * Render a text input with auto completed suggestions
     */
    public render(): React.ReactNode {
        const {
            suggestedValue = '',
            value = ''
        } = this.props;
        return (
            <div className="inline-autocomplete-container">
                <div className="inline-autocomplete-suggestions">{ suggestedValue }</div>
                <input className="inline-autocomplete"
                    type="text"
                    onChange={ this.onTextInputChanged }
                    onMouseDown={ (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); } }
                    value={ value }
                    autoFocus={ true }
                    onFocus={ this.moveCursorEnd }
                />
            </div>
        );
    }

    /**
     * Move the cursor of the input to the end of the input on focus
     * @param event The focus event
     */
    @autobind
    private moveCursorEnd(event: React.FocusEvent<HTMLElement>) {
        const input = event.target as HTMLInputElement;
        const length = input.value.length;

        input.setSelectionRange(length, length);
    }

    /**
     * When user types in text start displaying the suggestions underneath it
     * @param event
     */
    @autobind
    private onTextInputChanged(event: React.FormEvent<HTMLElement>): void {
        const {
            onChange
        } = this.props;

        const currentValue = (event.target as HTMLInputElement).value;
        onChange(currentValue);
    }
}
