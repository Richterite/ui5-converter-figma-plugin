import type { EventHandler } from "@create-figma-plugin/utilities";
import type { ModulesInitiator } from "./utils/builder";
import type { figmaInstanceNameToUI5ControlMap } from "./utils/mapper";

export interface ResizeWindowHandler extends EventHandler {
	name: "RESIZE_WINDOW";
	handler: (windowSize: { width: number; height: number }) => void;
}

export interface ConvertFigmaHandler extends EventHandler {
	name: "CONVERT_FIGMA";
	handler: (viewModules: ModulesInitiator) => void;
}

export interface CopyToClipboardHandler extends EventHandler {
	name: "COPY_TO_CLIPBOARD";
	handler: () => void;
}

export interface GenerateTreeStructure extends EventHandler {
	name: "GENERATE_TREE_STRUCTURE";
	handler: () => void;
}

export type SelectOptions = {
	label: string;
	value: string | number;
};

export type MapperKey = keyof typeof figmaInstanceNameToUI5ControlMap;
export type MapperValues = (typeof figmaInstanceNameToUI5ControlMap)[MapperKey];

export type TreeChartNode = {
	name: string;
	attributes?: {
		figmaNodeType?: string;
		ui5Control?: string;
		text?: string;
		value?: string;
		placeholder?: string;
		icon?: string;
		required?: string;
	};
	children?: TreeChartNode[];
};
