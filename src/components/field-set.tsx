// biome-ignore lint/correctness/noUnusedImports: for react component
import { h } from "preact";
import type { ReactNode } from "preact/compat";
import styles from "../styles.css";

interface FieldSetContainerProps {
	title: string;
	children: ReactNode;
}

export default function FieldSetContainer({
	children,
	title,
}: FieldSetContainerProps) {
	return (
		<fieldset className={styles.fieldset}>
			<legend className={styles.legend}>{title}</legend>
			{children}
		</fieldset>
	);
}
