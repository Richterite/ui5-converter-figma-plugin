export interface ModulesInitiator {
	controllerName: string;
	pageTitle: string;
	displayBlock?: string;
	xmlns?: string;
	"xmlns:core"?: string;
	"xmlns:l"?: string;
	"xmlns:f"?: string;
	[key: string]: string | undefined;
}
export type Mapper = { [key: string]: string };
export class BlockBuilder {
	mapper: Mapper;
	private readonly SELF_CLOSING_CONTROLS = [
		"sap.m.Input",
		"sap.m.Label",
		"sap.m.Title",
		"sap.m.Text",
		"sap.ui.core.Icon",
		"sap.m.Avatar",
		"sap.m.ProgressIndicator",
		"sap.m.Switch",
		"sap.m.BusyIndicator",
		"sap.m.RatingIndicator",
		"sap.m.Link",
		"sap.m.CheckBox",
		"sap.m.RadioButton",
		"sap.m.Button",
	];

	constructor(mapper: Mapper) {
		this.mapper = mapper;
	}

	public getFullControlName(instanceName: string): string | undefined {
		if (this.mapper[instanceName]) {
			return this.mapper[instanceName];
		}

		const lowerInstanceName = instanceName.toLowerCase();
		const foundKeyExact = Object.keys(this.mapper).find(
			(key) => key.toLowerCase() === lowerInstanceName,
		);
		if (foundKeyExact) {
			return this.mapper[foundKeyExact];
		}

		return undefined;
	}

	getBaseTagName(fullControlName: string) {
		if (!fullControlName || typeof fullControlName !== "string") {
			return "";
		}
		const parts = fullControlName.split(".");
		return parts[parts.length - 1] || "";
	}

	blockInitiator(modulesInit: ModulesInitiator) {
		const { controllerName, displayBlock, pageTitle, ...xmlAttrs } =
			modulesInit;

		let attrString = `controllerName="${controllerName}"`;
		if (displayBlock) {
			attrString += ` displayBlock="${displayBlock}"`;
		}

		for (const [key, value] of Object.entries(xmlAttrs)) {
			if (key.startsWith("xmlns:") && value) {
				attrString += ` ${key}="${value}"`;
			}
		}

		if (xmlAttrs.xmlns) {
			attrString += ` xmlns="sap.m"`;
		}

		if (!xmlAttrs["xmlns:core"]) {
			attrString += ` xmlns:core="sap.ui.core"`;
		}
		if (!xmlAttrs["xmlns:mvc"]) {
			attrString += ` xmlns:mvc="sap.ui.core.mvc"`;
		}

		const header = `<mvc:View ${attrString}><Shell><App><Page title="${pageTitle}">`;
		const footer = "</Page></App></Shell></mvc:View>";
		// const attr = Object.entries(modulesInit)
		// 	.map(([key, value]) => {
		// 		return `${key}="${value}"`;
		// 	})
		// 	.join(" ");
		return {
			header,
			footer,
			pageRequiresContentTag: true,
		};
	}

	public buildBlock(instanceName: string): string[] {
		const fullControlName = this.getFullControlName(instanceName);
		if (!fullControlName) return [];
		const controlTag = this.getBaseTagName(fullControlName);

		if (this.SELF_CLOSING_CONTROLS.includes(fullControlName)) {
			return [`<${controlTag} />`];
		}

		return [`<${controlTag}>`, `</${controlTag}>`];
	}
}
