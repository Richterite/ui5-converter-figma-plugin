import isEqual from "fast-deep-equal";

export function isSameObject(obj1: object, obj2: object) {
	return isEqual(obj1, obj2);
}
