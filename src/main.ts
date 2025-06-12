import { on, showUI } from "@create-figma-plugin/utilities";

import type { GenerateTreeStructure, GenerateXMLHandler } from "./types";
import { Formatter } from "./utils/formatter";

const formatter = new Formatter();
const selection = figma.currentPage.selection;

export default function () {
	on<GenerateXMLHandler>("GENERATE_XML", (viewModules) => {
		figma.notify("Generating XML...");

		if (selection.length === 0) {
			figma.notify("Please select at least one layer to generate XML.", {
				error: true,
			});
			figma.ui.postMessage({
				type: "NODE_ERROR",
				message: "No layers selected.",
			});
			return;
		}

		try {
			// -- uncomment if needed --
			// For logging the tree structure
			// formatter.traverseLogger(selection[0]);

			const bodyXML = formatter.generateBodyXML(selection);
			setTimeout(() => {
				figma.ui.postMessage({
					type: "XML_RESULT",
					bodyXML: bodyXML,
					viewModules: viewModules,
				});
			}, 1000);
			figma.notify("XML generated successfully!");
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			figma.notify(`Error generating XML: ${message}`, { error: true });
		}
	});
	on("COPY_TO_CLIPBOARD", () => {
		figma.notify("XML copied to clipboard!");
	});

	on<GenerateTreeStructure>("GENERATE_TREE_STRUCTURE", () => {
		figma.notify("Generating Tree Structure");
		if (selection.length === 0) {
			figma.notify("Please select at least one layer to generate XML.", {
				error: true,
			});
			figma.ui.postMessage({
				type: "NODE_ERROR",
				message: "No layers selected.",
			});
			return;
		}
		try {
			const treeStructure = formatter.buildTreeChart(selection[0]);
			setTimeout(() => {
				figma.ui.postMessage({
					type: "GENERATE_TREE_STRUCTURE",
					tree: treeStructure,
				});
			}, 1000);
			figma.notify("Tree generated successfully!");
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			figma.notify(`Error generating Tree: ${message}`, { error: true });
		}
	});
	showUI(
		{ height: 520, width: 800 },
		{
			placeholder:
				"Select a Figma frame/node and click 'Generate XML'.\nConfigure modules below.",
		},
	);
}
