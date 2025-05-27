import { BlockBuilder, type ModulesInitiator } from "./builder";
import { figmaInstanceNameToUI5ControlMap } from "./mapper";

export class Formatter {
	builder: BlockBuilder;
	constructor() {
		this.builder = new BlockBuilder(figmaInstanceNameToUI5ControlMap);
		// 	this.xmlHeader = `
		//     <mvc:View controllerName="ui5.walkthrough.controller.App"
		//     xmlns="sap.m"
		//     xmlns:mvc="sap.ui.core.mvc"
		//     displayBlock="true">
		//     <Shell>
		//         <App>
		//         <pages>
		//             <Page title="{i18n>homePageTitle}">
		//             <content>`;

		// 	this.xmlFooter = `
		//             </content>
		//             </Page>
		//         </pages>
		//         </App>
		//     </Shell>
		//     </mvc:View>`;
	}
	generateXML(
		nodes: readonly SceneNode[],
		viewModules: ModulesInitiator,
	): string {
		const {
			header: docHeader,
			footer: docFooter,
			pageRequiresContentTag,
		} = this.builder.blockInitiator(viewModules);
		const bodyContent = nodes
			.map((node) => this.traverseNode(node))
			.filter((xmlString) => xmlString.trim() !== "")
			.join("\n");

		let outBody = bodyContent;
		if (pageRequiresContentTag) {
			const content = bodyContent.trim() ? "\n" : "";
			outBody = `<content>\n${bodyContent}\n</content>`;
		}
		// const body = nodes.map((node) => this.traverseNode(node)).join("\n");
		const fullXML = `${docHeader}\n${outBody}\n${docFooter}`;
		return this.formatXml(fullXML);
	}

	private traverseNode(node: SceneNode): string {
		if (node.type === "TEXT") {
			const textContent = this.escapeXml(node.characters);
			return textContent.trim() ? `<Text text="${textContent}" />` : "";
		}
		const hasChildern =
			"children" in node && node.children && node.children.length > 0;
		const tags = this.builder.buildBlock(node.name, hasChildern);

		let childXML = "";

		if (hasChildern && node.children) {
			childXML = node.children
				.map((child) => this.traverseNode(child))
				.filter((xmlString) => xmlString.trim() !== "")
				.join("\n");
		}

		if (tags.length === 0) {
			if (hasChildern && childXML.trim()) {
				console.warn(
					`Node "${node.name}" (${node.type}) tidak ditemukan di mapper, menggunakan VBox sebagai fallback.`,
				);
				return `<VBox>\n${childXML}\n</VBox>`;
			}

			return "";
		}

		if (tags.length === 1) {
			if (hasChildern && childXML.trim()) {
				console.warn(
					`Node "${node.name}" dihasilkan sebagai self-closing (${tags[0]}) oleh BlockBuilder tetapi memiliki anak Figma. Anak-anak diabaikan.`,
				);
			}
			return tags[0];
		}

		if (tags.length === 2) {
			const contentSeparator = childXML.trim() ? "\n" : "";
			return `${tags[0]}${contentSeparator}${childXML}${contentSeparator}${tags[1]}`;
		}
		return "<VBox />";
	}
	private escapeXml(unsafe: string): string {
		return unsafe.replace(/[<>&"']/g, (c) => {
			switch (c) {
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case "&":
					return "&amp;";
				case '"':
					return "&quot;";
				case "'":
					return "&apos;";
				default:
					return c;
			}
		});
	}

	formatXml(xml: string) {
		let formatted = "";
		let indentLevel = 0;
		const tab = "\t";
		xml.split(/>\s*</).forEach((nodePart, index, array) => {
			let currentLine = "";
			if (index === 0) {
				currentLine = `${nodePart}>`;
			} else if (index === array.length - 1) {
				// Bagian terakhir, tambahkan <
				currentLine = `<${nodePart}`;
			} else {
				// Bagian tengah, tambahkan < dan >
				currentLine = `<${nodePart}>`;
			}

			const trimmedLine = currentLine.trim();

			if (trimmedLine.startsWith("</")) {
				// Tag penutup
				indentLevel = Math.max(0, indentLevel - 1);
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			} else if (trimmedLine.endsWith("/>")) {
				// Tag self-closing
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			} else if (trimmedLine.startsWith("<")) {
				// Tag pembuka
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
				indentLevel++;
			} else {
				// Konten teks (jika ada setelah split)
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			}
		});
		return formatted.trim();
	}

	traverseLogger(node: SceneNode, depth = 0): void {
		// if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
		// 	const componentNode = node as ComponentNode | ComponentSetNode;
		// 	console.log(
		// 		`${"".repeat(depth * 2)}- ${componentNode.name} (${componentNode.type}) [Component] ${componentNode.description}`,
		// 	);
		// } else if (node.type === "INSTANCE") {
		// 	const instanceNode = node as InstanceNode;
		// 	console.log(
		// 		`${"".repeat(depth * 2)}- ${instanceNode.name}  ${this.builder.buildBlock(instanceNode.name, instanceNode.children.length > 0)} [Instance] `,
		// 	);
		// }
		console.log(`${" ".repeat(depth * 2)}- ${node.name} (${node.type})`);
		if ("children" in node) {
			for (const child of node.children) {
				this.traverseLogger(child, depth + 1);
			}
		}
	}
}
