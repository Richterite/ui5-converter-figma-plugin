import type { MapperValues, TreeChartNode } from "../types";
import { BlockBuilder } from "./builder";
import { figmaInstanceNameToUI5ControlMap } from "./mapper";
export class Formatter {
	builder: BlockBuilder;
	constructor() {
		this.builder = new BlockBuilder(figmaInstanceNameToUI5ControlMap);
	}

	public generateBodyXML(nodes: readonly SceneNode[]) {
		return nodes
			.map((node) => this.traverseNode(node).xmlString)
			.filter((xmlString) => xmlString && xmlString.trim() !== "")
			.join("\n");
	}

	public generateTreeChart(nodes: readonly SceneNode[]): TreeChartNode {
		if (nodes.length > 1) {
			return {
				name: "Root",
				attributes: {
					figmaNodeType: "ROOT_WRAPPER",
				},
				children: nodes
					.map((node) => this.traverseNode(node).chartNode)
					.filter(Boolean) as TreeChartNode[],
			};
		}

		const result = this.traverseNode(nodes[0]);
		if (!result.chartNode) {
			throw new Error("Root node chartNode is null or undefined.");
		}
		return result.chartNode;
	}

	private traverseNode(node: SceneNode): {
		xmlString: string;
		chartNode: TreeChartNode | null;
	} {
		const chartNode: TreeChartNode = {
			name: node.name,
			attributes: {
				figmaNodeType: node.type,
			},
		};

		let xmlString = "";

		if (node.type === "INSTANCE") {
			const instanceNode = node as InstanceNode;
			const instanceName = instanceNode.name;
			const ui5ControlType = this.getUi5ControlType(instanceName);

			const attributesObject = this.extractAttributes(
				instanceNode,
				ui5ControlType,
			);
			if (!chartNode.attributes) {
				chartNode.attributes = {};
			}
			if (ui5ControlType) {
				chartNode.attributes.ui5Control = ui5ControlType;
			}
			Object.assign(chartNode.attributes, attributesObject);

			const childResults = (instanceNode.children || []).map((child) =>
				this.traverseNode(child),
			);

			const childXML = childResults
				.map((r) => r.xmlString)
				.filter((str) => str && str.trim() !== "")
				.join("\n");

			chartNode.children = childResults
				.map((r) => r.chartNode)
				.filter(Boolean) as TreeChartNode[];

			const tags = this.builder.buildBlock(instanceName);
			if (tags.length > 0) {
				const attributeString = Object.entries(attributesObject)
					.map(([key, value]) => `${key}="${this.escapeXml(value)}"`)
					.join(" ");

				const finalAttributeString = attributeString
					? ` ${attributeString}`
					: "";

				if (tags.length === 1) {
					xmlString = tags[0].replace(/\s*\/>$/, `${finalAttributeString} />`);
				} else if (tags.length === 2) {
					const openingTagWithAttr = tags[0].replace(
						/>$/,
						`${finalAttributeString}>`,
					);
					const contentSeparator = childXML.trim() ? "\n" : "";
					xmlString = `${openingTagWithAttr}${contentSeparator}${childXML}${contentSeparator}${tags[1]}`;
				}
			} else if (childXML.trim()) {
				xmlString = `\n${childXML}\n`;
			}
		} else if (
			"children" in node &&
			node.children &&
			node.children.length > 0
		) {
			const childResults = node.children.map((child) =>
				this.traverseNode(child),
			);

			xmlString = childResults
				.map((r) => r.xmlString)
				.filter((str) => str && str.trim() !== "")
				.join("\n");

			chartNode.children = childResults
				.map((r) => r.chartNode)
				.filter(Boolean) as TreeChartNode[];
		}

		return { xmlString, chartNode };
	}

	private getUi5ControlType(instanceName: string): MapperValues {
		let fullControlName = this.builder.mapper[instanceName];
		if (!fullControlName) {
			const keyFound = Object.keys(this.builder.mapper).find((key) =>
				instanceName.toLowerCase().includes(key.toLowerCase()),
			);
			if (keyFound) {
				fullControlName = this.builder.mapper[keyFound];
			}
		}
		return fullControlName as MapperValues;
	}

	private extractAttributes(
		instanceNode: SceneNode,
		ui5ControlType?: MapperValues,
	): Record<string, string> {
		const attributes: Record<string, string> = {};
		const addAttribute = (name: string, value?: string | null) => {
			if (value?.trim()) {
				if (!attributes[name]) {
					attributes[name] = value.trim();
				}
			}
		};

		if (ui5ControlType) {
			const hasChild = "children" in instanceNode && instanceNode.children;

			if (ui5ControlType === "sap.m.FlexBox") {
				addAttribute("fitContainer", "true");
				addAttribute("direction", "Column");
				addAttribute("justifyContent", "Center");
				addAttribute("alignItems", "Center");
				addAttribute("class", "sapUiSmallMargin");
			}

			if (ui5ControlType.endsWith(".Label")) {
				addAttribute("class", "sapUiSmallMarginBottom");
				if (hasChild) {
					const textChild = instanceNode.children.find(
						(c): c is TextNode => c.type === "TEXT" && !!c.characters,
					);
					if (textChild) {
						const asteriskChild = instanceNode.children.find(
							(c): c is TextNode =>
								c.type === "TEXT" && c.name.toLowerCase() === "asterisk",
						);
						const fullText =
							textChild.characters +
							(asteriskChild ? asteriskChild.characters : "");
						addAttribute("text", fullText);
						if (asteriskChild) {
							addAttribute("required", "true");
						}
					}
				}
			}

			if (
				ui5ControlType.endsWith(".Button") ||
				ui5ControlType.endsWith(".Link") ||
				ui5ControlType.endsWith(".Title")
			) {
				if (hasChild) {
					const textChild = instanceNode.children.find(
						(c): c is TextNode => c.type === "TEXT",
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

			if (
				ui5ControlType.endsWith(".Input") ||
				ui5ControlType.endsWith(".TextArea")
			) {
				addAttribute("width", "18rem");
				if (hasChild) {
					for (const child of instanceNode.children) {
						if (child.type === "TEXT" && child.characters) {
							if (child.name.toLowerCase().includes("placeholder")) {
								addAttribute("placeholder", child.characters);
							} else {
								addAttribute("value", child.characters);
							}
						} else if (
							child.type === "FRAME" &&
							"children" in child &&
							child.children
						) {
							for (const grandChild of child.children) {
								if (grandChild.type === "TEXT" && grandChild.characters) {
									if (grandChild.name.toLowerCase().includes("placeholder")) {
										addAttribute("placeholder", grandChild.characters);
									} else {
										addAttribute("value", grandChild.characters);
									}
								}
							}
						}
					}
				}
			}

			if (ui5ControlType.endsWith(".Button") && hasChild) {
				addAttribute("class", "sapUiMediumMarginTop");
				for (const child of instanceNode.children) {
					let iconNamedFound: string | undefined;
					if (
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

		return attributes;
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

	buildTreeChart(node: SceneNode): TreeChartNode {
		const chartNode: TreeChartNode = {
			name: node.name,
		};

		if ("children" in node && node.children.length > 0) {
			chartNode.attributes = {
				figmaNodeType: node.type,
			};

			chartNode.children = node.children.map((child) =>
				this.buildTreeChart(child),
			);
		}
		return chartNode;
	}
}
