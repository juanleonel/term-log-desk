import { appConstants } from './app.constants.js';

export function isNullOrUndefined(value) {
  return value === null || value === undefined;
}

export function isString(value) {
  return typeof value === 'string';
}

export function isStringEmpty(value) {
  return value?.trim() === appConstants.stringEmpty;
}

export function isArrayEmpty(value) {
  return Array.isArray(value) && value?.length === 0;
}

export function toBool(value) {
  return value?.trim() === 'true';
}
