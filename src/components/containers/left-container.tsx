// biome-ignore lint/correctness/noUnusedImports: for react component
import { h } from "preact";
import type { ReactNode } from "preact/compat";
import styles from "../../styles.css";

interface LeftContainerProps {
	children: ReactNode;
}

export default function LeftContainer({ children }: LeftContainerProps) {
	return <div className={styles.editorPanel}>{children}</div>;
}
