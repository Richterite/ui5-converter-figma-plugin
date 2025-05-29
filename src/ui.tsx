import "!prismjs/themes/prism-okaidia.css";

import { Button, Container, Text, render } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-xml-doc.js";
import Editor from "react-simple-code-editor";

import CheckboxGroup from "./components/chekcbox";
import InputField from "./components/input-field";
import styles from "./styles.css";
import type {
	CopyToClipboardHandler,
	GenerateXMLHandler,
	GenerateXMLResult,
} from "./types";
import { BlockBuilder, type ModulesInitiator } from "./utils/builder";
import { Formatter } from "./utils/formatter";
import { figmaInstanceNameToUI5ControlMap } from "./utils/mapper";

function copyToClipboard(text: string) {
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log("Copied to clipboard using Clipboard API");
			})
			.catch((err) => {
				console.error("Failed to copy with Clipboard API", err);
			});
	} else {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand("copy");
		} catch (err) {
			console.error("Unable to copy to clipboard", err);
		}
		document.body.removeChild(textArea);
	}
	console.log("Code copied unsecured");
	emit<CopyToClipboardHandler>("COPY_TO_CLIPBOARD");
}

const availableModules = {
	xmlns: "sap.m",
	"xmlns:core": "sap.ui.core",
	"xmlns:l": "sap.ui.layout",
	"xmlns:f": "sap.f", // SAP Fiori Flexible Column Layout, Cards, etc.
	"xmlns:form": "sap.ui.layout.form", // for SimpleForm, FormContainer
	"xmlns:unified": "sap.ui.unified", // for FileUploader
};

const initialViewModules: ModulesInitiator = {
	controllerName: "sap.ui.demo.todo.controller.App",
	displayBlock: "true",
	pageTitle: "My Application",
	xmlns: "sap.m",
	"xmlns:mvc": "sap.ui.core.mvc",
};

function Plugin({ placeholder }: { placeholder: string }) {
	const [xml, setXml] = useState("");
	const [currentViewModules, setCurrentViewModules] =
		useState<ModulesInitiator>(initialViewModules);

	const [controllerName, setControllerName] = useState<string>(
		initialViewModules.controllerName,
	);
	const [pageTitle, setPageTitle] = useState<string>(
		initialViewModules.pageTitle,
	);

	const builderRef = useRef(new BlockBuilder(figmaInstanceNameToUI5ControlMap));
	const formatterRef = useRef(new Formatter());

	const updatePreviewXML = useCallback((viewModules: ModulesInitiator) => {
		const { header, footer, pageRequiresContentTag } =
			builderRef.current.blockInitiator(viewModules);
		let previewBody = "";
		if (pageRequiresContentTag) {
			previewBody = `  <content>\n    ${previewBody}\n  </content>\n`;
		}

		setXml(
			formatterRef.current.formatXml(`${header}\n${previewBody}${footer}`),
		);
	}, []);

	useEffect(() => {
		updatePreviewXML(initialViewModules);
	}, [updatePreviewXML]);

	const onCopyButtonClick = useCallback(() => {
		if (xml && xml.length > 0) {
			copyToClipboard(xml);
		} else {
			console.warn("Tidak ada XML untuk disalin.");
		}
	}, [xml]);

	const onHandleGenerateClick = useCallback(() => {
		emit<GenerateXMLHandler>("GENERATE_XML", currentViewModules);
	}, [currentViewModules]);

	const onCheckboxChangeHandler = useCallback(
		(selectedModule: string[]) => {
			const newViewModules: ModulesInitiator = {
				...initialViewModules,
			};

			for (const module of selectedModule) {
				const xmlnsKey = (
					Object.keys(availableModules) as Array<keyof typeof availableModules>
				).find((key) => availableModules[key] === module);

				if (xmlnsKey) {
					newViewModules[xmlnsKey] = module;
				}
				// Use xmlnsKey here as needed
			}

			if (!newViewModules.xmlns) {
				newViewModules.xmlns = "sap.m";
			}

			if (!newViewModules["xmlns:mvc"]) {
				newViewModules["xmlns:mvc"] = "sap.ui.core.mvc";
			}

			setCurrentViewModules(newViewModules);
			updatePreviewXML(newViewModules);
		},
		[updatePreviewXML],
	);

	useEffect(() => {
		window.onmessage = (e) => {
			const { pluginMessage } = e.data;
			if (pluginMessage.type === "XML_RESULT") {
				setXml(pluginMessage.xml);
			}
		};
	}, []);

	const checkboxOptions = Object.entries(availableModules)
		.filter(
			([key, _]) =>
				key !== "xmlns" && key !== "xmlns:mvc" && key !== "xmlns:core",
		)
		.map(([key, value]) => ({
			label: key.startsWith("xmlns:")
				? key.substring("xmlns:".length).toUpperCase()
				: value,
			value: value,
			defaultChecked: !!initialViewModules[key],
		}));
	console.log("Checkbox options:", checkboxOptions);
	return (
		<Container
			style={{
				padding: "16px",
			}}
			space="medium"
		>
			<div className={styles.gridContainer}>
				<div className={styles.settingsPanel}>
					<Text style={{ fontWeight: "bold", marginBottom: "8px" }}>
						XML Settings
					</Text>
					<CheckboxGroup
						title="Select Namespaces"
						options={checkboxOptions}
						onValueChange={onCheckboxChangeHandler}
					/>
					<fieldset className={styles.fieldset}>
						<legend className={styles.legend}>Configuration</legend>
						<InputField
							labelName="Page Title"
							placeholder={pageTitle}
							value={pageTitle}
							onChangeValue={setPageTitle}
						/>
						<InputField
							labelName="Controller Name"
							placeholder={controllerName}
							value={controllerName}
							onChangeValue={setControllerName}
						/>
					</fieldset>

					<Button
						fullWidth
						onClick={onHandleGenerateClick}
						style={{
							marginTop: "16px",
						}}
					>
						Generate XML
					</Button>
				</div>
				<div className={styles.editorPanel}>
					<Editor
						highlight={(code) => {
							try {
								return highlight(code, languages.xml, "xml");
							} catch (e) {
								return code;
							}
						}}
						padding={10}
						disabled
						onValueChange={setXml}
						value={xml}
						placeholder={placeholder}
						className={styles.editor}
					/>
					<Button
						fullWidth
						onClick={onCopyButtonClick}
						style={{ marginTop: "8px" }}
					>
						Copy
					</Button>
				</div>
			</div>
		</Container>
	);
}

export default render(Plugin);
