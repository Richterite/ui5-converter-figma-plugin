// biome-ignore lint/correctness/noUnusedImports: for component
import { h } from "preact";
import type { ReactNode } from "preact/compat";
import styles from "../../styles.css";

interface RightContainerProps {
	children: ReactNode;
}

export default function RightContainer({ children }: RightContainerProps) {
	return <div className={styles.settingsPanel}>{children}</div>;
}
