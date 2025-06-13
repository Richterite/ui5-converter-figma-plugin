import type { ModulesInitiator } from "./builder";

export const availableModules = {
	xmlns: "sap.m",
	"xmlns:core": "sap.ui.core",
	"xmlns:l": "sap.ui.layout",
	"xmlns:f": "sap.f", // SAP Fiori Flexible Column Layout, Cards, etc.
	"xmlns:form": "sap.ui.layout.form", // for SimpleForm, FormContainer
	"xmlns:unified": "sap.ui.unified", // for FileUploader
} as const;

export const initialViewModules: ModulesInitiator = {
	controllerName: "sap.ui.demo.todo.controller.App",
	displayBlock: "true",
	pageTitle: "My Application",
	xmlns: "sap.m",
	"xmlns:mvc": "sap.ui.core.mvc",
} as const;
