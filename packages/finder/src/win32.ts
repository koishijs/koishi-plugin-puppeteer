import { join } from "path";
import { canAccess } from "./utils";

const prefixes = [
  process.env.LOCALAPPDATA,
  process.env.PROGRAMFILES,
  process.env["PROGRAMFILES(X86)"],
];

const chromeSuffixes = [
  "\\Chromium\\Application\\chrome.exe",
  "\\Google\\Chrome\\Application\\chrome.exe",
  "\\chrome-win32\\chrome.exe",
  "\\Microsoft\\Edge\\Application\\msedge.exe",
  "\\Google\\Chrome Beta\\Application\\chrome.exe",
  "\\Microsoft\\Edge Dev\\Application\\msedge.exe",
  "\\Google\\Chrome SxS\\Application\\chrome.exe",
  "\\Microsoft\\Edge Canary\\Application\\msedge.exe",
];

const firefoxSuffixes = [
  "\\Mozilla Firefox\\firefox.exe",
  "\\Firefox Developer Edition\\firefox.exe",
  "\\Firefox Nightly\\firefox.exe",
];

export default function win32(product: "chrome" | "firefox" = "chrome") {
  const installations = [];
  const suffixes = product === "firefox" ? firefoxSuffixes : chromeSuffixes;

  prefixes.forEach((prefix) =>
    suffixes.forEach((suffix) => {
      if (prefix) {
        const browserPath = join(prefix, suffix);
        if (canAccess(browserPath)) {
          installations.push(browserPath);
        }
      }
    }),
  );
  return installations;
}
