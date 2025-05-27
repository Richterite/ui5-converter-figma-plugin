import { Checkbox, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { h } from "preact";
import type { ChangeEvent } from "preact/compat";
import { useCallback, useState } from "preact/hooks";
import styles from "../styles.css";

export default function CheckboxGroup({
	options,
	onValueChange,
	title,
}: {
	options: Array<{ label: string; value: string; defaultChecked?: boolean }>;
	title: string;
	onValueChange: (values: string[]) => void;
}) {
	const [selected, setSelected] = useState<Record<string, boolean>>(() => {
		const initialState: Record<string, boolean> = {};
		for (const option of options) {
			initialState[option.value] = option.defaultChecked || false;
		}

		return initialState;
	});
	const onChangeHandler = useCallback(
		(option: string) => {
			const newState = {
				...selected,
				[option]: !selected[option],
			};
			setSelected(newState);
			const selectedValues = Object.entries(newState)
				.filter(([_, isChecked]) => isChecked)
				.map(([value, _]) => value);
			onValueChange(selectedValues);
		},
		[onValueChange, selected],
	);

	return (
		<fieldset className={styles.fieldset}>
			<legend className={styles.legend}>{title}</legend>
			{options.map((option) => (
				<div key={option.value} className={styles.checkboxItem}>
					<Checkbox
						id={option.value}
						value={selected[option.value]}
						onChange={() => onChangeHandler(option.value)}
					>
						<Text>
							{option.label} ({option.value})
						</Text>
					</Checkbox>
					<VerticalSpace space="extraSmall" />
					{/* <input
						type="checkbox"
						id={option.value}
						name={option.label}
						value={option.value}
						checked={selected[option.value]}
						onChange={() => onChangeHandler(option.value)}
					/>
					<label htmlFor={option.value} style={{ marginLeft: "8px" }}>
						{option.label} ({option.value})
					</label> */}
				</div>
			))}
		</fieldset>
	);
}
