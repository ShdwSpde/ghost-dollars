import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
/** @type {import('next').NextConfig} */
export default { reactStrictMode: true, turbopack: { root: __dirname } };
