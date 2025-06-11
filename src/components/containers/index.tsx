import { Container } from "@create-figma-plugin/ui";
// biome-ignore lint/correctness/noUnusedImports: For react element
import { h } from "preact";
import { Children, type ReactElement, isValidElement } from "preact/compat";
import styles from "../../styles.css";
import LeftContainer from "./left-container";
import RightContainer from "./right-container";

type LeftContainerElement = ReactElement<typeof LeftContainer>;
type RightContainerElement = ReactElement<typeof RightContainer>;

interface ContainerProps {
	children:
		| [LeftContainerElement, RightContainerElement]
		| [RightContainerElement, LeftContainerElement];
}

export default function ContainerComponent({ children }: ContainerProps) {
	const leftNode = Children.toArray(children).find(
		(child) => isValidElement(child) && child.type === LeftContainer,
	) as LeftContainerElement;
	const rightNode = Children.toArray(children).find(
		(child) => isValidElement(child) && child.type === RightContainer,
	) as RightContainerElement;
	return (
		<Container
			style={{
				padding: "16px",
			}}
			space="medium"
		>
			<div className={styles.gridContainer}>
				{leftNode}
				{rightNode}
			</div>
		</Container>
	);
}
