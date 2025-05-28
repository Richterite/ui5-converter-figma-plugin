import { h } from "preact";
import { type TargetedEvent, forwardRef } from "preact/compat";
import { useCallback, useId } from "preact/hooks";
import styles from "../styles.css";

interface InputFieldProps {
	labelName: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	defaultValue?: string;
	onChangeValue?: (value: string) => void;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
	function InputField(
		{
			value,
			labelName,
			disabled,
			placeholder,
			defaultValue,
			onChangeValue,
		}: InputFieldProps,
		ref,
	) {
		const id = useId();
		const onChangeHandler = useCallback(
			(e: TargetedEvent<HTMLInputElement, Event>) => {
				if (onChangeValue) {
					console.log("Logged Input", e.currentTarget.value);
					onChangeValue(e.currentTarget.value);
				}
			},
			[onChangeValue],
		);
		return (
			<div>
				<label htmlFor={id}>{labelName} :</label>
				<input
					id={id}
					type="text"
					ref={ref}
					defaultValue={defaultValue}
					value={value}
					onChange={onChangeHandler}
					placeholder={placeholder}
					disabled={disabled}
					className={styles["input-text"]}
				/>
			</div>
		);
	},
);

export default InputField;
