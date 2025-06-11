import { on, showUI } from "@create-figma-plugin/utilities";

import type { GenerateXMLHandler } from "./types";
import { Formatter } from "./utils/formatter";

export default function () {
	on<GenerateXMLHandler>("GENERATE_XML", (viewModules) => {
		figma.notify("Generating XML...");
		const selection = figma.currentPage.selection;
		if (selection.length === 0) {
			figma.notify("Please select at least one layer to generate XML.", {
				error: true,
			});
			figma.ui.postMessage({
				type: "XML_ERROR",
				message: "No layers selected.",
			});
			return;
		}
		const formatter = new Formatter();
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
	showUI(
		{ height: 520, width: 800 },
		{
			placeholder:
				"Select a Figma frame/node and click 'Generate XML'.\nConfigure modules below.",
		},
	);
}
