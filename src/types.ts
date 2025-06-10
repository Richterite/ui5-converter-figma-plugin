import type { EventHandler } from "@create-figma-plugin/utilities";
import type { ModulesInitiator } from "./utils/builder";
import type { figmaInstanceNameToUI5ControlMap } from "./utils/mapper";

export interface ResizeWindowHandler extends EventHandler {
	name: "RESIZE_WINDOW";
	handler: (windowSize: { width: number; height: number }) => void;
}

export interface GenerateXMLHandler extends EventHandler {
	name: "GENERATE_XML";
	handler: (viewModules: ModulesInitiator) => void;
}

export interface GenerateXMLResult extends EventHandler {
	name: "XML_RESULT";
	handler: (msg: { xml: string }) => void;
}

export interface CopyToClipboardHandler extends EventHandler {
	name: "COPY_TO_CLIPBOARD";
	handler: () => void;
}

export type SelectOptions = {
	label: string;
	value: string | number;
};

export type MapperKey = keyof typeof figmaInstanceNameToUI5ControlMap;
export type MapperValues = (typeof figmaInstanceNameToUI5ControlMap)[MapperKey];
