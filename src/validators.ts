const minMaxLength = (str: string, min: number, max: number, fieldName: string = "String") => {
  if (str.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters long.`);
  }
  if (str.length > max) {
    throw new Error(`${fieldName} must be at most ${max} characters long.`);
  }
};

const noLeadingTrailingWhitespace = (str: string, fieldName: string = "String") => {
  if (str !== str.trim()) {
    throw new Error(`${fieldName} cannot have leading or trailing whitespace.`);
  }
};

const isLowercaseEnglishHyphenated = (str: string, fieldName: string = "String") => {
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(str)) {
    throw new Error(`${fieldName} must contain only lowercase English letters, with single hyphens between words.`);
  }
};

const isLowercaseEnglishUnderscored = (str: string, fieldName: string = "String") => {
  if (!/^[a-z]+(?:_[a-z]+)*$/.test(str)) {
    throw new Error(`${fieldName} must contain only lowercase English letters, with single underscores between words.`);
  }
};

const isWrappedInCurlyBraces = (str: string, fieldName: string = "String") => {
  if (!str.startsWith("{") || !str.endsWith("}")) {
    throw new Error(`${fieldName} must start with an opening curly brace and end with a closing curly brace.`);
  }
};

const isValidURL = (str: string, fieldName: string = "String") => {
  try {
    const url = new URL(str);

    if (!/^https?:\/\//i.test(str)) {
      throw new Error();
    }

    return url;
  } catch {
    throw new Error(`${fieldName} must be a valid URL starting with http:// or https://.`);
  }
};

const isValidOrigin = (str: string, fieldName: string = "String") => {
  const url = isValidURL(str, fieldName);

  // Check href so even empty query (?) and fragment (#) components are rejected.
  if (url.username !== "" || url.password !== "" || url.pathname !== "/" || url.href.includes("?") || url.href.includes("#")) {
    throw new Error(
      `${fieldName} must be a valid HTTP or HTTPS origin with only a host and optional port, without credentials, paths, queries, or fragments.`,
    );
  }
};

const isValidVersion = (str: string, fieldName: string = "String") => {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(str)) {
    throw new Error(`${fieldName} must use X.Y.Z format without leading zeros.`);
  }
};

const noDuplicatesInArray = (arr: readonly unknown[], fieldName: string = "Array") => {
  if (new Set(arr).size !== arr.length) {
    throw new Error(`${fieldName} cannot contain duplicates.`);
  }
};

const noEmptyArray = (arr: readonly unknown[], fieldName: string = "Array") => {
  if (arr.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
};

const isContainedInArray = (value: unknown, arr: readonly unknown[], fieldName: string = "Value") => {
  if (!arr.includes(value)) {
    throw new Error(`${fieldName} must be one of the following: ${arr.join(", ")}.`);
  }
};

const validators = {
  minMaxLength,
  noLeadingTrailingWhitespace,
  isLowercaseEnglishHyphenated,
  isLowercaseEnglishUnderscored,
  isWrappedInCurlyBraces,
  isValidURL,
  isValidOrigin,
  isValidVersion,
  noDuplicatesInArray,
  noEmptyArray,
  isContainedInArray,
};

export default validators;
