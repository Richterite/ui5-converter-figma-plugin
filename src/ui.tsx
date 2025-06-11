import { Tabs, type TabsOption, render } from "@create-figma-plugin/ui";

// biome-ignore lint/correctness/noUnusedImports: use to maintain preact component
import { h } from "preact";
import type { TargetedEvent } from "preact/compat";
import { useCallback, useMemo, useState } from "preact/hooks";
import GeneratorLayer from "./components/layers/generator-layer";
import TreeLayer from "./components/layers/tree-layer";

function Plugin({ placeholder }: { placeholder: string }) {
	const tabOptions: Array<TabsOption> = useMemo(
		() => [
			{
				value: "XML Generator",
				children: <GeneratorLayer placeholder={placeholder} />,
			},
			{
				value: "Tree Strcuture",
				children: <TreeLayer />,
			},
		],
		[placeholder],
	);
	const [currentTab, setCurrentTab] = useState(tabOptions[0].value);

	const onTabsChangeHandler = useCallback(
		(e: TargetedEvent<HTMLInputElement>) => {
			const newValue = e.currentTarget.value;
			setCurrentTab(newValue);
		},
		[],
	);

	return (
		<Tabs
			onChange={onTabsChangeHandler}
			options={tabOptions}
			value={currentTab}
		/>
	);
}

export default render(Plugin);
