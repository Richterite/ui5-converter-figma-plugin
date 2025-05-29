import "!prismjs/themes/prism-okaidia.css";

import {
	Button,
	Container,
	Text,
	VerticalSpace,
	render,
} from "@create-figma-plugin/ui";
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
				// biome-ignore lint/suspicious/noConsoleLog: For Logging Only
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
	const [displayXml, setDisplayXml] = useState<string>("");
	const [generatedBodyXml, setGenereatedBodyXml] = useState<string>("");
	const [currentViewModules, setCurrentViewModules] =
		useState<ModulesInitiator>(initialViewModules);

	const [isLoading, setIsloading] = useState<boolean>(false);

	const builderRef = useRef(new BlockBuilder(figmaInstanceNameToUI5ControlMap));
	const formatterRef = useRef(new Formatter());

	const buildFormatFullXml = useCallback(
		(body: string, viewModules: ModulesInitiator) => {
			const { header, footer, pageRequiresContentTag } =
				builderRef.current.blockInitiator(viewModules);
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

			return formatterRef.current.formatXml(`${header}\n${content}\n${footer}`);
		},
		[],
	);

	useEffect(() => {
		const bodyForDisplay = generatedBodyXml || "    ";
		const fullXml = buildFormatFullXml(bodyForDisplay, currentViewModules);
		setDisplayXml(fullXml);
	}, [buildFormatFullXml, currentViewModules, generatedBodyXml]);

	const onCopyButtonClick = useCallback(() => {
		if (displayXml && displayXml.length > 0) {
			copyToClipboard(displayXml);
		} else {
			console.warn("Tidak ada XML untuk disalin.");
		}
	}, [displayXml]);

	const onHandleGenerateClick = useCallback(() => {
		setIsloading(true);
		emit<GenerateXMLHandler>("GENERATE_XML", currentViewModules);
	}, [currentViewModules]);

	const onCheckboxChangeHandler = useCallback(
		(libraryPath: string, isChecked: boolean) => {
			setCurrentViewModules((prev) => {
				const newModules: ModulesInitiator = { ...prev };

				const xmlnsKey = (
					Object.keys(availableModules) as Array<keyof typeof availableModules>
				).find((key) => availableModules[key] === libraryPath);

				if (xmlnsKey) {
					if (isChecked) {
						newModules[xmlnsKey] = libraryPath;
					} else {
						delete newModules[xmlnsKey];
					}
				}

				return newModules;
			});
		},
		[],
	);

	const titleChangeHandler = useCallback((newTitle: string) => {
		setCurrentViewModules((prev) => ({
			...prev,
			pageTitle: newTitle,
		}));
	}, []);

	const controllerNameChangeHandler = useCallback((newController: string) => {
		setCurrentViewModules((prev) => ({
			...prev,
			controllerName: newController,
		}));
	}, []);

	useEffect(() => {
		window.onmessage = (e) => {
			setIsloading(false);
			const { pluginMessage } = e.data;
			if (pluginMessage.type === "XML_RESULT") {
				setGenereatedBodyXml(pluginMessage.bodyXML);
				setCurrentViewModules(pluginMessage.viewModules);
			}
		};
	}, []);

	const checkboxOptions = Object.entries(availableModules)
		.filter(
			([key]) => key !== "xmlns" && key !== "xmlns:mvc" && key !== "xmlns:core",
		)
		.map(([key, value]) => ({
			label: key.startsWith("xmlns:")
				? key.substring("xmlns:".length).toUpperCase()
				: value,
			value: value,
		}));
	const checkedLibraries = Object.entries(currentViewModules)
		.filter(
			([key, value]) =>
				key.startsWith("xmlns:") &&
				value &&
				availableModules[key as keyof typeof availableModules] === value,
		)
		.map(([_, value]) => value as string);
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
						checkedLibraries={checkedLibraries}
						onValueChange={onCheckboxChangeHandler}
					/>
					<VerticalSpace space="small" />
					<fieldset className={styles.fieldset}>
						<legend className={styles.legend}>Configuration</legend>
						<InputField
							labelName="Page Title"
							placeholder="Enter Page Title"
							value={currentViewModules.pageTitle ?? ""}
							onChangeValue={titleChangeHandler}
						/>
						<InputField
							labelName="Controller Name"
							placeholder="Enter Controller Name"
							value={currentViewModules.controllerName ?? ""}
							onChangeValue={controllerNameChangeHandler}
						/>
					</fieldset>
					<VerticalSpace space="medium" />
					<Button
						fullWidth
						onClick={onHandleGenerateClick}
						style={{
							marginTop: "16px",
						}}
						disabled={isLoading}
						loading={isLoading}
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
						onValueChange={() => {}}
						padding={10}
						disabled
						value={displayXml}
						placeholder={placeholder}
						className={styles.editor}
					/>
					<VerticalSpace space="small" />
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
