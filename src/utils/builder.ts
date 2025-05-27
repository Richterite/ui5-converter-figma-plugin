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

// function BlockInitiator( modulesInit : ModulesInitiator){
//     const attr = Object.entries(modulesInit)
//     .map(([key, value]) => `${key}="${value}"`)
//     .join(' ');
//     return `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core" ${attr} /><App><Page>|</Page></App></mvc:View> `
// }

// export function blockBuilder(headers: ModulesInitiator , content: string) {
//     const initBlock = BlockInitiator(headers).split('|');
//     return initBlock[0] + content + initBlock[1]
// }

// interface BlockBuilderInterface {
//     new
// }

export class BlockBuilder {
	mapper: Mapper;
	private readonly ALWAYS_SELF_CLOSING_CONTROLS = ["sap.ui.core.Icon"];

	constructor(mapper: Mapper) {
		this.mapper = mapper;
	}

	private getFullControlName(instanceName: string) {
		let fullControlName = this.mapper[instanceName];
		if (!fullControlName) {
			const foundKey = Object.keys(this.mapper).find((key) =>
				instanceName.toLowerCase().includes(key.toLowerCase()),
			);
			if (foundKey) {
				fullControlName = this.mapper[foundKey];
			}
		}
		return fullControlName;
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

		if (!xmlAttrs.xmlns) {
			attrString += ` xmlns="sap.m"`;
		}

		if (!xmlAttrs["xmlns:core"]) {
			attrString += ` xmlns:core="sap.ui.core"`;
		}
		if (!xmlAttrs["xmlns:mvc"]) {
			attrString += ` xmlns:mvc="sap.ui.core.mvc"`;
		}

		const header = `<mvc:View ${attrString}><App><Page title="${pageTitle}">`;
		const footer = "</Page></App></mvc:View>";
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

	buildBlock(instanceName: string, hasChildren: boolean) {
		const fullControlName = this.getFullControlName(instanceName);
		if (!fullControlName) {
			return [];
		}

		const controlTag = this.getBaseTagName(fullControlName);

		if (hasChildren) {
			return [`<${controlTag}>`, `</${controlTag}>`];
		}
		if (this.ALWAYS_SELF_CLOSING_CONTROLS.includes(fullControlName)) {
			return [`<${controlTag} />`];
		}

		return [`<${controlTag} />`];
	}

	// blockBuilder(headers: ModulesInitiator, content: string) {
	// 	const initBlock = this.blockInitiator(headers).split("|");
	// 	return initBlock[0] + content + initBlock[1];
	// }
}
