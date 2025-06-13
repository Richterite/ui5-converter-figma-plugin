import isEqual from "fast-deep-equal";
import { BlockBuilder, type ModulesInitiator } from "./builder";
import { Formatter } from "./formatter";
import { figmaInstanceNameToUI5ControlMap } from "./mapper";

export function isSameObject(obj1: object, obj2: object) {
	return isEqual(obj1, obj2);
}

export function buildFormatFullXml(
	body: string,
	viewModules: ModulesInitiator,
) {
	const builder = new BlockBuilder(figmaInstanceNameToUI5ControlMap);
	const formatter = new Formatter();
	const { header, footer, pageRequiresContentTag } =
		builder.blockInitiator(viewModules);
	let content = body;

	if (pageRequiresContentTag) {
		if (body.trim()) {
			const indentedBody = body
				.split("\n")
				.map((line) => `    ${line}`)
				.join("\n");
			content = `    <content>\n${indentedBody}\n    </content>`;
		} else {
			content = "    <content></content>";
		}
	}

	return formatter.formatXml(`${header}\n${content}\n${footer}`);
}
