import {
	loadFontsAsync,
	on,
	once,
	showUI,
} from "@create-figma-plugin/utilities";

import type { GenerateXMLHandler } from "./types";
import { Formatter } from "./utils/formatter";

export default function () {
	// once<InsertCodeHandler>('INSERT_CODE', async function (code: string) {
	//   const text = figma.createText()
	//   await loadFontsAsync([text])
	//   text.characters = code
	//   figma.currentPage.selection = [text]
	//   figma.viewport.scrollAndZoomIntoView([text])
	//   figma.closePlugin()
	// })
	// on('UI_READY', function () {
	//   console.log('UI IS READY')
	//   figma.ui.postMessage({ type: 'XML_RESULT', xml: 'test' })
	//   console.log('Message sent to ui')
	// })
	on<GenerateXMLHandler>("GENERATE_XML", (viewModules) => {
		figma.notify("Generating XML...");
		const selection = figma.currentPage.selection;
		if (selection.length === 0) {
			figma.notify("Please select at least one layer to generate XML.", {
				error: true,
			});
			return;
		}
		const formatter = new Formatter();
		try {
			// formatter.traverseLogger(selection[0]);
			const xml = formatter.generateXML(selection, viewModules);
			figma.notify("XML generated successfully!");
			setTimeout(() => {
				figma.ui.postMessage({
					type: "XML_RESULT",
					xml,
				});
			}, 1000);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			figma.notify(`Error generating XML: ${message}`, { error: true });
		}
	});
	on("COPY_TO_CLIPBOARD", () => {
		figma.notify("XML copied to clipboard!");
	});
	showUI(
		{ height: 480, width: 800 },
		{
			placeholder:
				"Select a Figma frame/node and click 'Generate XML'.\nConfigure modules below.",
		},
	);
}
