/** View-state vocabulary of the digital twin, shared by the 3D scene, its toolbar and the UI store. */
export type TwinLayer = "skin" | "organs" | "bones" | "vessels";
export type TwinLayers = Record<TwinLayer, boolean>;
export type TwinViewPreset = "front" | "back" | "left" | "right" | "top" | "reset";
