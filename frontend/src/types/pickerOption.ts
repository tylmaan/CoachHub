import type { Player } from './player';

export interface PickerOption {
  player: Player;
  inLineup: boolean;
  fitsPosition: boolean;
}