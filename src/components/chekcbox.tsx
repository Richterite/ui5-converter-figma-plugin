import { Checkbox, Text, VerticalSpace } from "@create-figma-plugin/ui";
// biome-ignore lint/correctness/noUnusedImports: maintain preact component
import { h } from "preact";
import styles from "../styles.css";

interface CheckboxOption {
	label: string;
	value: string;
}

interface CheckboxGroupProps {
	title: string;
	options: Array<CheckboxOption>;
	checkedLibraries: string[];
	onValueChange: (libPath: string, isChecked: boolean) => void;
}

export default function CheckboxGroup({
	title,
	options,
	checkedLibraries,
	onValueChange,
}: CheckboxGroupProps) {
	return (
		<fieldset className={styles.fieldset}>
			<legend className={styles.legend}>{title}</legend>
			<VerticalSpace space="small" />
			{options.map((option) => (
				<div key={option.value} className={styles.checkboxItem}>
					<Checkbox
						value={checkedLibraries.includes(option.value)}
						onValueChange={(isCheckded) =>
							onValueChange(option.value, isCheckded)
						}
					>
						<Text>
							{option.label} ({option.value})
						</Text>
					</Checkbox>
					<VerticalSpace space="extraSmall" />
				</div>
			))}
		</fieldset>
	);
}
