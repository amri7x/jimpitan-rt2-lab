const fs = require("fs");
const path = require("path");

const mobileRoot = path.resolve(__dirname, "..");
const tailwindRoot = path.join(mobileRoot, "node_modules", "tailwindcss");
const nativewindRoot = path.resolve(mobileRoot, "..", "..", "node_modules", "nativewind");
const target = path.join(nativewindRoot, "node_modules", "tailwindcss");
const version = require(path.join(tailwindRoot, "package.json")).version;

if (!version.startsWith("3.")) {
  throw new Error(`NativeWind 4 requires Tailwind CSS 3; received ${version}.`);
}

if (fs.existsSync(target)) {
  const resolved = fs.realpathSync(target);
  if (resolved !== fs.realpathSync(tailwindRoot)) {
    throw new Error(`Refusing to replace existing NativeWind Tailwind dependency: ${resolved}`);
  }
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.symlinkSync(tailwindRoot, target, "dir");
}
