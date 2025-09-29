// Enum-like constants for request types and status
export const RequestType = {
	VOLUNTEER: '志工人力',
	SUPPLY: '物資需求',
};

export const RequestStatus = {
	NEW: '新登記',
	IN_PROGRESS: '處理中',
	COMPLETED: '已完成',
};

/**
 * @typedef {Object} Request
 * @property {string} id
 * @property {keyof typeof RequestType | string} type
 * @property {keyof typeof RequestStatus | string} status
 * @property {string} contactPerson
 * @property {string} contactPhone
 * @property {string} address
 * @property {string} description
 * @property {Date} createdAt
 * @property {{ name: string, phone: string, note?: string }[]=} volunteers
 */

/**
 * Utility to get the display label from enum-like objects
 * @param {typeof RequestType | typeof RequestStatus} enumObj
 * @param {string} keyOrValue
 */
export function getEnumLabel(enumObj, keyOrValue) {
	// if value matches one of the values, return it
	const values = Object.values(enumObj);
	if (values.includes(keyOrValue)) return keyOrValue;
	// if key matches, return the value
	if (enumObj[keyOrValue] !== undefined) return enumObj[keyOrValue];
	return String(keyOrValue);
}

/**
 * @param {any} req
 */
export function getVolunteerCount(req) {
	return Array.isArray(req?.volunteers) ? req.volunteers.length : 0;
}
