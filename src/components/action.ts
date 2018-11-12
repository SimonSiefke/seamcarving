export type ActionType =
  | "REMOVE_SEAMS"
  | "ADD_SEAMS"
  | "SHOW_SEAMS"
  | "INITIALIZE";

export interface Action {
  type: ActionType;
  /**
   * parameters for the webworker to work with
   */
  payload?: {
    numberOfSeams?: number;
    width?: number;
    height?: number;
    data?: number;
    buffer?: ArrayBuffer | SharedArrayBuffer;
  };
  /**
   * which parameters can be shared with the webworker (e.g. shared arrays)
   */
  transferable?: any[];
}
