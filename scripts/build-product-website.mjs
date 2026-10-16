// Dependency-free static website build for Vercel. The application stays on Sites.
import { prepareProductWebsite } from "./prepare-product-website.mjs";

const output = await prepareProductWebsite();
console.log(`Static GraphicRouter website ready: ${output}`);
