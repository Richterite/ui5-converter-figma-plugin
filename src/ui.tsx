import {
	Button,
	Container,
	Tabs,
	type TabsOption,
	render,
} from "@create-figma-plugin/ui";

import { emit } from "@create-figma-plugin/utilities";
// biome-ignore lint/correctness/noUnusedImports: use to maintain preact component
import { h } from "preact";
import type { TargetedEvent } from "preact/compat";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import GeneratorLayer from "./components/layers/generator-layer";
import TreeLayer from "./components/layers/tree-layer";
import type { ConvertFigmaHandler, TreeChartNode } from "./types";
import type { ModulesInitiator } from "./utils/builder";
import { availableModules, initialViewModules } from "./utils/constant";
import { buildFormatFullXml, isSameObject } from "./utils/helper";

function Plugin({ placeholder }: { placeholder: string }) {
	const [isLoading, setIsloading] = useState<boolean>(false);
	const [treeData, setTreeData] = useState<TreeChartNode | null>(null);
	const [displayXml, setDisplayXml] = useState<string>("");
	const [generatedBodyXml, setGenereatedBodyXml] = useState<string>("");
	const [viewModules, setViewModules] =
		useState<ModulesInitiator>(initialViewModules);
	const tabOptions: Array<TabsOption> = useMemo(
		() => [
			{
				value: "XML Generator",
				children: (
					<GeneratorLayer
						placeholder={placeholder}
						xmlToDisplay={displayXml}
						availableModules={availableModules}
						viewModule={viewModules}
						onViewModuleChange={setViewModules}
					/>
				),
			},
			{
				value: "Tree Strcuture",
				children: <TreeLayer data={treeData} />,
			},
		],
		[placeholder, displayXml, viewModules, treeData],
	);

	const [currentTab, setCurrentTab] = useState(tabOptions[0].value);

	useEffect(() => {
		const bodyForDisplay = generatedBodyXml || "    ";
		const fullXml = buildFormatFullXml(bodyForDisplay, viewModules);
		setDisplayXml(fullXml);
	}, [viewModules, generatedBodyXml]);

	useEffect(() => {
		window.onmessage = (e) => {
			setIsloading(false);
			const { pluginMessage } = e.data;
			if (pluginMessage.type === "CONVERT_RESULT") {
				setGenereatedBodyXml(pluginMessage.bodyXML);
				setViewModules(pluginMessage.viewModules);
				setTreeData(pluginMessage.treeData);
			}
		};
	}, []);

	const onTabsChangeHandler = useCallback(
		(e: TargetedEvent<HTMLInputElement>) => {
			const newValue = e.currentTarget.value;
			setCurrentTab(newValue);
		},
		[],
	);

	const onResetButtonClick = useCallback(() => {
		setViewModules(initialViewModules);
		setGenereatedBodyXml("");
		setTreeData(null);
	}, []);

	const onHandleGenerateClick = useCallback(() => {
		setIsloading(true);
		emit<ConvertFigmaHandler>("CONVERT_FIGMA", viewModules);
	}, [viewModules]);

	const needResetMemo = useMemo(
		() =>
			!isSameObject(viewModules, initialViewModules) ||
			generatedBodyXml.trim() !== "",
		[viewModules, generatedBodyXml],
	);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
			}}
		>
			<div style={{ flexGrow: 1, overflowY: "auto" }}>
				<Container space="medium">
					<Tabs
						onChange={onTabsChangeHandler}
						options={tabOptions}
						value={currentTab}
					/>
				</Container>
			</div>
			<Container space="medium">
				<Button
					fullWidth
					onClick={onHandleGenerateClick}
					style={{
						marginTop: "16px",
					}}
					disabled={isLoading || needResetMemo}
					loading={isLoading}
				>
					Convert
				</Button>
				<Button
					fullWidth
					onClick={onResetButtonClick}
					style={{
						marginTop: "10px",
						marginBottom: "13px",
					}}
					danger
					disabled={!needResetMemo}
				>
					Reset
				</Button>
			</Container>
		</div>
	);
}

export default render(Plugin);
