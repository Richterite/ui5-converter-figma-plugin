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
		return this.formatXml(fullXML);
	}

	public generateBodyXML(nodes: readonly SceneNode[]) {
		return nodes
			.map((node) => this.traverseNode(node))
			.filter((xmlString) => xmlString && xmlString.trim() !== "")
			.join("\n");
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

			const tags = this.builder.buildBlock(instanceName);
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
										iconNamedFound = iconTextChild.characters.trim();
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
				currentLine = `<${nodePart}`;
			} else {
				currentLine = `<${nodePart}>`;
			}

			const trimmedLine = currentLine.trim();

			if (trimmedLine.startsWith("</")) {
				indentLevel = Math.max(0, indentLevel - 1);
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			} else if (trimmedLine.endsWith("/>")) {
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			} else if (trimmedLine.startsWith("<")) {
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
				indentLevel++;
			} else {
				formatted += `${tab.repeat(indentLevel)}${trimmedLine}\n`;
			}
		});
		return formatted.trim();
	}

	traverseLogger(node: SceneNode, depth = 0, logLines: string[] = []): string {
		logLines.push(
			`${" ".repeat(depth * 2)}${"-".repeat(depth + 1)} ${node.name} (${node.type})`,
		);
		if ("children" in node) {
			for (const child of node.children) {
				this.traverseLogger(child, depth + 1, logLines);
			}
		}
		if (depth === 0) {
			const logString = logLines.join("\n");
			// biome-ignore lint/suspicious/noConsoleLog: for logging purpose
			console.log(logString);
			return logString;
		}
		return "";
	}
}
