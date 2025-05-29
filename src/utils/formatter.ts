import xmlFormat from "xml-formatter";
import { BlockBuilder, type ModulesInitiator } from "./builder";
import { figmaInstanceNameToUI5ControlMap } from "./mapper";
export class Formatter {
	builder: BlockBuilder;
	constructor() {
		this.builder = new BlockBuilder(figmaInstanceNameToUI5ControlMap);
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
			.filter((xmlString) => xmlString && xmlString.trim() !== "")
			.join("\n");

		let outBody = bodyContent;
		if (pageRequiresContentTag && bodyContent.trim()) {
			const contentIndent = "\n";
			outBody = `<content>${contentIndent}${bodyContent}${contentIndent}</content>`;
		} else if (pageRequiresContentTag) {
			outBody = "<content></content>";
		}
		// const body = nodes.map((node) => this.traverseNode(node)).join("\n");
		const fullXML = `${docHeader}\n${outBody}\n${docFooter}`;
		return xmlFormat(fullXML);
	}

	private traverseNode(node: SceneNode): string {
		if (node.type === "INSTANCE") {
			const instanceNode = node as InstanceNode;
			const instanceName = instanceNode.name;
			const hasChild =
				"children" in instanceNode &&
				instanceNode.children &&
				instanceNode.children.length > 0;

			const ui5ControlType = this.getUi5ControlType(instanceName);

			const tags = this.builder.buildBlock(instanceName, hasChild);
			const attributes = this.extractAttributes(instanceNode, ui5ControlType);

			let childXML = "";

			if (hasChild) {
				childXML = instanceNode.children
					.map((child) => this.traverseNode(child))
					.filter((xmlString) => xmlString && xmlString.trim() !== "")
					.join("\n");
			}
			if (tags.length === 0) {
				if (childXML.trim()) {
					console.warn(
						`Node "${node.name}" (${node.type}) tidak ditemukan di mapper, menggunakan VBox sebagai fallback.`,
					);
					return `\n${childXML}\n`;
				}

				return "";
			}

			const attributeString = attributes ? ` ${attributes}` : "";

			if (tags.length === 1) {
				if (hasChild && childXML.trim()) {
					console.warn(
						`Node "${node.name}" dihasilkan sebagai self-closing (${tags[0]}) oleh BlockBuilder tetapi memiliki anak Figma. Anak-anak diabaikan.`,
					);
				}
				return tags[0].replace(/\s*\/>$/, `${attributeString} />`);
			}

			if (tags.length === 2) {
				const openingTagsWithAttr = tags[0].replace(
					/>$/,
					`${attributeString}>`,
				);
				const contentSeparator = childXML.trim() ? "\n" : "";
				return `${openingTagsWithAttr}${contentSeparator}${childXML}${contentSeparator}${tags[1]}`;
			}

			return "";
		}

		if (
			(node.type === "FRAME" ||
				node.type === "GROUP" ||
				node.type === "SECTION") &&
			"children" in node &&
			node.children &&
			node.children.length > 0
		) {
			return node.children
				.map((child) => this.traverseNode(child))
				.filter((xmlString) => xmlString && xmlString.trim() !== "")
				.join("\n");
		}

		// if (node.type === "TEXT") {
		// 	const textContent = this.escapeXml(node.characters);
		// 	return textContent.trim() ? `<Text text="${textContent}" />` : "";
		// }

		return "";
	}

	private getUi5ControlType(instanceName: string) {
		let fullControlName = this.builder.mapper[instanceName];
		if (!fullControlName) {
			const keyFound = Object.keys(this.builder.mapper).find((key) =>
				instanceName.toLowerCase().includes(key.toLowerCase()),
			);
			if (keyFound) {
				fullControlName = this.builder.mapper[keyFound];
			}
		}
		return fullControlName;
	}

	private extractAttributes(instanceNode: SceneNode, ui5ControlType?: string) {
		const attributes: string[] = [];
		const addAttribute = (name: string, value?: string | null) => {
			if (value?.trim()) {
				const escapedValue = this.escapeXml(value.trim());
				if (!attributes.some((attr) => attr.startsWith(`${name}=`))) {
					attributes.push(`${name}="${escapedValue}"`);
				}
			}
		};

		addAttribute("id", instanceNode.id);

		if (ui5ControlType) {
			const hasChild = "children" in instanceNode && instanceNode.children;
			if (
				ui5ControlType.endsWith(".Button") ||
				ui5ControlType.endsWith(".Link") ||
				ui5ControlType.endsWith(".Label") ||
				ui5ControlType.endsWith(".Title")
			) {
				if (hasChild) {
					const textChild = instanceNode.children.find(
						(c) => c.type === "TEXT",
					);
					if (textChild?.characters) {
						addAttribute("text", textChild.characters);
					} else if (
						!ui5ControlType.endsWith(".Button") ||
						!instanceNode.name.toLowerCase().includes("icon")
					) {
						addAttribute("text", instanceNode.name);
					}
				} else if (
					!ui5ControlType.endsWith(".Button") ||
					!instanceNode.name.toLowerCase().includes("icon")
				) {
					addAttribute("text", instanceNode.name);
				}
			}

			// Input/TextArea
			if (
				ui5ControlType.endsWith(".Input") ||
				ui5ControlType.endsWith(".TextArea")
			) {
				if (hasChild) {
					for (const child of instanceNode.children) {
						if (child.type === "TEXT" && child.characters) {
							const lowerName = child.name.toLowerCase();
							const textChars = child.characters;
							if (lowerName.includes("placeholder")) {
								addAttribute("placeholder", textChars);
							} else {
								addAttribute("value", textChars);
							}
						} else if (
							child.type === "FRAME" &&
							"children" in child &&
							child.children
						) {
							for (const grandChild of child.children) {
								if (grandChild.type === "TEXT" && grandChild.characters) {
									const grandChildLower = grandChild.name.toLowerCase();
									const textChars = grandChild.characters;
									if (grandChildLower.includes("placeholder")) {
										addAttribute("placeholder", textChars);
									} else {
										addAttribute("value", textChars);
									}
								}
							}
						}
					}
				}
			}

			if (ui5ControlType === "sap.ui.core.Icon") {
				let iconSrc = instanceNode.name;
				if ("children" in instanceNode && instanceNode.children) {
					const textChildNode = instanceNode.children.find(
						(c): c is TextNode =>
							c.type === "TEXT" &&
							c.characters !== undefined &&
							c.characters.trim().startsWith("sap-icon://"),
					);
					if (textChildNode) {
						iconSrc = textChildNode.characters.trim();
					}

					if (!iconSrc.includes("://") && iconSrc.trim()) {
						iconSrc = `sap-icon://${iconSrc.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}`;
					}
					addAttribute("src", iconSrc);
				}
			}

			if (
				ui5ControlType.endsWith(".Button") &&
				"children" in instanceNode &&
				instanceNode.children
			) {
				for (const child of instanceNode.children) {
					let iconNamedFound: string | undefined;
					if (child.type === "INSTANCE") {
						const childUi5Type = this.getUi5ControlType(child.name);
						if (childUi5Type === "sap.ui.core.Icon") {
							iconNamedFound = child.name;
							if ("children" in child && child.children) {
								const iconTextChild = child.children.find(
									(c): c is TextNode =>
										c.type === "TEXT" && c.characters !== undefined,
								);
								if (iconTextChild?.characters) {
									if (
										iconTextChild.characters.trim().startsWith("sap-icon://")
									) {
										iconNamedFound = iconTextChild.characters.trim();
									} else {
										iconNamedFound = iconTextChild.characters.trim(); // Ambil teks mentah jika ada
									}
								}
							}
						}
					} else if (
						child.type === "TEXT" &&
						(child.name.toLowerCase().includes("icon") ||
							child.characters?.startsWith("sap-icon://"))
					) {
						if (child.characters) iconNamedFound = child.characters;
					}

					if (iconNamedFound) {
						if (!iconNamedFound.includes("://") && iconNamedFound.trim()) {
							iconNamedFound = `sap-icon://${iconNamedFound.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}`;
						}
						addAttribute("icon", iconNamedFound);
						break;
					}
				}
			}
		}

		return attributes.join(" ");
		// const instanceName = instanceNode.name;

		// if ("children" in instanceNode && instanceNode.children) {
		// 	const textChildren = instanceNode.children.filter(
		// 		(child) => child.type === "TEXT",
		// 	) as TextNode[];

		// 	if (textChildren.length > 0) {
		// 		if (
		// 			ui5ControlType &&
		// 			(ui5ControlType.endsWith(".Button") ||
		// 				ui5ControlType.endsWith(".Label") ||
		// 				ui5ControlType.endsWith(".Title") ||
		// 				ui5ControlType.endsWith(".Link"))
		// 		) {
		// 			const primaryTextNode = textChildren[0];
		// 			if (primaryTextNode?.characters.trim()) {
		// 				attributes += ` text="${this.escapeXml(primaryTextNode.characters.trim())}"`;
		// 			}
		// 		}
		// 	} else if (ui5ControlType?.endsWith(".Input")) {
		// 		const valueNode = textChildren.find(
		// 			(node) =>
		// 				node.name.toLowerCase().includes("value") ||
		// 				node.name.toLowerCase() === instanceName.toLowerCase(),
		// 		);
		// 		const placeholderNode = textChildren.find((node) =>
		// 			node.name.toLowerCase().includes("placeholder"),
		// 		);

		// 		if (valueNode?.characters.trim()) {
		// 			attributes += ` value="${this.escapeXml(valueNode.characters.trim())}"`;
		// 		} else if (textChildren.length === 1 && !placeholderNode) {
		// 			attributes += ` value="${this.escapeXml(textChildren[0].characters.trim())}"`;
		// 		}

		// 		if (placeholderNode?.characters.trim()) {
		// 			attributes += ` placeholder="${this.escapeXml(placeholderNode.characters.trim())}"`;
		// 		}
		// 	}
		// }
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
