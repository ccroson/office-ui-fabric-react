import { GridTheme } from '../common/Common';
import { Color } from '../constants/ColorConstants';

export namespace GridThemes {
  const standardIconSize = '20px';

  /** The green theme used for project grids */
  export const Green: GridTheme = {
    backgroundColor: Color.White,
    borderColor: Color.NeutralLight,
    primaryCellBackgroundColor: Color.White,
    selectedCellsBackgroundColor: Color.White,
    selectionBorderColor: '#31752f',
    selectedHeaderTextColor: Color.NeutralPrimary,
    selectedHeaderBackgroundColor: '#eaf1ea',
    textColor: Color.NeutralPrimary,
    iconSize: standardIconSize
  };

  /** theme used for disabling border selection styles in case of list */
  export const NoBorder: GridTheme = {
    backgroundColor: Color.White,
    borderColor: 'transparent',
    primaryCellBackgroundColor: 'transparent',
    selectedCellsBackgroundColor: 'transparent',
    selectionBorderColor: 'transparent',
    selectedHeaderTextColor: Color.NeutralPrimary,
    selectedHeaderBackgroundColor: 'transparent',
    textColor: Color.NeutralPrimary,
    iconSize: standardIconSize
  };
}
