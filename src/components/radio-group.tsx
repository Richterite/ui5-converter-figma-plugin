import {
	RadioButtons,
	type RadioButtonsOption,
	Text,
} from "@create-figma-plugin/ui";
// biome-ignore lint/correctness/noUnusedImports: for react component
import { h } from "preact";
import type { TargetedEvent } from "preact/compat";
import { useCallback } from "preact/hooks";

interface RadioGroupProps<TOptions = RadioButtonsOption["value"]> {
	title?: string;
	options: Array<RadioButtonsOption>;
	onValueChange: (value: TOptions) => void;
	value: string;
}

export default function RadioGroup<TOptions>({
	title,
	options,
	onValueChange,
	value,
}: RadioGroupProps<TOptions>) {
	const onChangeHandler = useCallback(
		(e: TargetedEvent<HTMLInputElement>) => {
			onValueChange(e.currentTarget.value as TOptions);
		},
		[onValueChange],
	);
	return (
		<div>
			{title && <Text>{title}</Text>}
			<RadioButtons
				options={options}
				value={value}
				onChange={onChangeHandler}
			/>
		</div>
	);
}
