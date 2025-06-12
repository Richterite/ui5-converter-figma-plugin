import { Button, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
// biome-ignore lint/correctness/noUnusedImports: for react component
import { h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import Tree from "react-d3-tree";
import styles from "../../styles.css";
import type { GenerateTreeStructure, TreeChartNode } from "../../types";
import ContainerComponent from "../containers";
import LeftContainer from "../containers/left-container";
import RightContainer from "../containers/right-container";
import FieldSetContainer from "../field-set";
import RadioGroup from "../radio-group";

const orientationsOptions = [
	{
		children: <Text>Vertical</Text>,
		value: "vertical",
	},
	{
		children: <Text>Horizontal</Text>,
		value: "horizontal",
	},
] as const;

const pathLineOptions = [
	{
		children: <Text>Straight</Text>,
		value: "straight",
	},
	{
		children: <Text>Diagonal</Text>,
		value: "diagonal",
	},
	{
		children: <Text>Elbow</Text>,
		value: "elbow",
	},
	{
		children: <Text>Step</Text>,
		value: "step",
	},
] as const;

type TreeSettings = {
	treeOrientation: (typeof orientationsOptions)[number]["value"];
	pathLine: (typeof pathLineOptions)[number]["value"];
};
export default function TreeLayer() {
	const [treeData, setTreeData] = useState<TreeChartNode>();
	const [translate, setTranslate] = useState({ x: 0, y: 0 });
	const [treeSettings, setTreeSettings] = useState<TreeSettings>({
		treeOrientation: orientationsOptions[0].value,
		pathLine: pathLineOptions[0].value,
	});

	const treeContainerRef = useRef<HTMLDivElement>(null);
	const onGenerateTreeHandler = useCallback(() => {
		emit<GenerateTreeStructure>("GENERATE_TREE_STRUCTURE");
	}, []);

	const onTreeOrientationChange = useCallback(
		(value: TreeSettings["treeOrientation"]) => {
			setTreeSettings((prev) => ({
				...prev,
				treeOrientation: value,
			}));
		},
		[],
	);
	const onTreePathLineChange = useCallback(
		(value: TreeSettings["pathLine"]) => {
			setTreeSettings((prev) => ({
				...prev,
				pathLine: value,
			}));
		},
		[],
	);

	useEffect(() => {
		window.onmessage = (e) => {
			const { pluginMessage } = e.data;
			if (pluginMessage.type === "GENERATE_TREE_STRUCTURE") {
				setTreeData(pluginMessage.tree as TreeChartNode);
			}
		};

		if (treeContainerRef.current) {
			const { width, height } =
				treeContainerRef.current.getBoundingClientRect();
			setTranslate({ x: width / 2, y: height / 5 });
		}
	}, []);
	return (
		<ContainerComponent>
			<LeftContainer>
				<FieldSetContainer title="Tree Settings">
					<FieldSetContainer title="Orientation">
						<RadioGroup
							options={[...orientationsOptions]}
							onValueChange={onTreeOrientationChange}
							value={treeSettings.treeOrientation}
						/>
					</FieldSetContainer>

					<VerticalSpace space="small" />
					<FieldSetContainer title="Path Line">
						<RadioGroup
							options={[...pathLineOptions]}
							onValueChange={onTreePathLineChange}
							value={treeSettings.pathLine}
						/>
					</FieldSetContainer>
				</FieldSetContainer>
				<VerticalSpace space="medium" />
				<Button fullWidth onClick={onGenerateTreeHandler}>
					Add Tree
				</Button>
			</LeftContainer>
			<RightContainer>
				<div className={styles["tree-container"]} ref={treeContainerRef}>
					{treeData && (
						<Tree
							data={treeData}
							translate={translate}
							separation={{ siblings: 0.5, nonSiblings: 1 }}
							orientation={treeSettings.treeOrientation}
							pathFunc={treeSettings.pathLine}
						/>
					)}
				</div>
			</RightContainer>
		</ContainerComponent>
	);
}
