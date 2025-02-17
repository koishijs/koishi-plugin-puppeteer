import win32 from "./win32";
import darwin from "./darwin";
import linux from "./linux";

const ERROR_PLATFORM_NOT_SUPPORT = new Error("platform not support");
const ERROR_NO_INSTALLATIONS_FOUND = new Error(
  "no browser installations found",
);

function findBrowsers(product: "chrome" | "firefox" = "chrome") {
  switch (process.platform) {
    case "win32":
      return win32(product);
    case "darwin":
      return darwin(product);
    case "linux":
    case "android":
      return linux(product);
    default:
      throw ERROR_PLATFORM_NOT_SUPPORT;
  }
}

/**
 * find a executable browser for all support system
 * @param product - browser type to find ('chrome' | 'firefox')
 * @returns executable browser full path
 * @throws
 * if no executable browser find, ERROR_NO_INSTALLATIONS_FOUND will be throw
 * if platform is not one if `win32`, `darwin`, `linux`, `android`, ERROR_PLATFORM_NOT_SUPPORT will be throw
 */
export default function findBrowser(product: "chrome" | "firefox" = "chrome") {
  const installations = findBrowsers(product);
  if (installations.length) {
    return installations[0];
  } else {
    throw ERROR_NO_INSTALLATIONS_FOUND;
  }
}
