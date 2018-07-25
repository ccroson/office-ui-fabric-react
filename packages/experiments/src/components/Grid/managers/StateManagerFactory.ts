import { SelectionMode } from '../common/Common';
import { StateManager, StateManagerParameters } from './StateManager';
import { NoOpStateManager } from './NoOpStateManager';
import { SingleRowStateManager } from './SingleRowStateManager';
import { MultipleRowStateManager } from './MultipleRowStateManager';
import { SingleCellStateManager } from './SingleCellStateManager';
import { MultipleCellStateManager } from './MultipleCellStateManager';

/**
 * The StateManagerFactory selects a StateManager based on a SelectionMode
 */
export namespace StateManagerFactory {

    /**
     * Select a StateManager based on a Selection mode
     * @param selectionMode The selection mode
     * @param parameters The parameters to pass to the state manager
     */
    export function createStateManager(selectionMode: SelectionMode, parameters: StateManagerParameters): StateManager {
        switch (selectionMode) {
            case SelectionMode.None:
                return new NoOpStateManager();
            case SelectionMode.SingleCell:
                return new SingleCellStateManager(parameters);
            case SelectionMode.MultipleCell:
                return new MultipleCellStateManager(parameters);
            case SelectionMode.SingleRow:
                return new SingleRowStateManager(parameters);
            case SelectionMode.MultipleRow:
                return new MultipleRowStateManager(parameters);
            default:
                return new NoOpStateManager();
        }
    }
}