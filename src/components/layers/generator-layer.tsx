import "prismjs";
import "!prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-xml-doc.js";

import { Button, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { useCallback, useState } from "preact/hooks";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-xml-doc.js";
import Editor from "react-simple-code-editor";

// biome-ignore lint/correctness/noUnusedImports: use to maintain preact component
import { h } from "preact";
import styles from "../../styles.css";
import type { CopyToClipboardHandler } from "../../types";
import type { ModulesInitiator } from "../../utils/builder";
import type { availableModules } from "../../utils/constant";
import CheckboxGroup from "../chekcbox";
import ContainerComponent from "../containers";
import LeftContainer from "../containers/left-container";
import RightContainer from "../containers/right-container";
import FieldSetContainer from "../field-set";
import InputField from "../input-field";

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

interface GeneratorLayerProps {
	placeholder: string;
	xmlToDisplay: string;
	viewModule: ModulesInitiator;
	availableModules: typeof availableModules;
	onViewModuleChange: (newModule: ModulesInitiator) => void;
}

type AvailableModuleKeys = keyof typeof availableModules;

export default function GeneratorLayer({
	placeholder,
	xmlToDisplay,
	viewModule,
	availableModules,
	onViewModuleChange,
}: GeneratorLayerProps) {
	const [currentViewModule, setCurrentViewModules] = useState(viewModule);
	const onCopyButtonClick = useCallback(() => {
		if (xmlToDisplay.length > 0) {
			copyToClipboard(xmlToDisplay);
		} else {
			console.warn("Tidak ada XML untuk disalin.");
		}
	}, [xmlToDisplay]);

	const onCheckboxChangeHandler = useCallback(
		(libraryPath: string, isChecked: boolean) => {
			setCurrentViewModules((prev) => {
				const newModules: ModulesInitiator = { ...prev };

				const xmlnsKey = Object.keys(availableModules).find(
					(key) => availableModules[key as AvailableModuleKeys] === libraryPath,
				);

				if (xmlnsKey) {
					if (isChecked) {
						newModules[xmlnsKey as keyof ModulesInitiator] = libraryPath;
					} else {
						delete newModules[xmlnsKey as keyof ModulesInitiator];
					}
				}
				return newModules;
			});

			onViewModuleChange(currentViewModule);
		},
		[availableModules, currentViewModule, onViewModuleChange],
	);

	const titleChangeHandler = useCallback(
		(newTitle: string) => {
			setCurrentViewModules((prev) => ({
				...prev,
				pageTitle: newTitle,
			}));
			onViewModuleChange(currentViewModule);
		},
		[onViewModuleChange, currentViewModule],
	);

	const controllerNameChangeHandler = useCallback(
		(newController: string) => {
			setCurrentViewModules((prev) => ({
				...prev,
				controllerName: newController,
			}));
			onViewModuleChange(currentViewModule);
		},
		[currentViewModule, onViewModuleChange],
	);

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
	const checkedLibraries = Object.entries(currentViewModule)
		.filter(
			([key, value]) =>
				key.startsWith("xmlns:") &&
				value &&
				availableModules[key as keyof typeof availableModules] === value,
		)
		.map(([_, value]) => value as string);

	return (
		<ContainerComponent>
			<LeftContainer>
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
				<FieldSetContainer title="Configuration">
					<InputField
						labelName="Page Title"
						placeholder="Enter Page Title"
						value={currentViewModule.pageTitle ?? ""}
						onChangeValue={titleChangeHandler}
					/>
					<InputField
						labelName="Controller Name"
						placeholder="Enter Controller Name"
						value={currentViewModule.controllerName ?? ""}
						onChangeValue={controllerNameChangeHandler}
					/>
				</FieldSetContainer>
				<VerticalSpace space="medium" />
			</LeftContainer>
			<RightContainer>
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
					value={xmlToDisplay}
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
			</RightContainer>
		</ContainerComponent>
	);
}
