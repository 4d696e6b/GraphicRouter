// Authoring/check helper only. Not imported by the published website.
export function validateConfig(config) {
  if (!config.productName?.trim() || !config.availabilityNote?.trim()) throw new Error("Product and availability text are required.");
  for (const key of ["repositoryUrl", "documentationUrl", "connectionUrl"]) {
    if (config[key] != null && !/^https:\/\/[^\s]+$/.test(config[key])) throw new Error(`${key} must be a verified HTTPS URL or null.`);
  }
  if (config.downloadUrl != null) {
    const url = config.downloadUrl;
    if (typeof url !== "string" || !( /^https:\/\/[^\s]+$/.test(url) || /^assets\/[a-zA-Z0-9_./-]+$/.test(url))) throw new Error("Download must be an official HTTPS artifact or bundled assets/ file.");
    if (url.split("/").includes("..") || /\.(?:pptx|svg|png|html)(?:[?#]|$)/i.test(url) || /github\.com\/[^/]+\/[^/]+\/(?:archive|zipball)/i.test(url)) throw new Error("A sample presentation or source archive is not a plugin distribution.");
    if (!config.supportedHostLabel || config.installationSteps?.length !== 3) throw new Error("A release needs verified host compatibility and three actual installation steps.");
  }
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function downloadAction(config, { section = false, compact = false } = {}) {
  if (config.downloadUrl) {
    const attribute = config.downloadUrl.startsWith("assets/") ? ` download${config.downloadFileName ? `="${escapeHtml(config.downloadFileName)}"` : ""}` : "";
    return `<a class="primary" data-plugin-download href="${escapeHtml(config.downloadUrl)}"${attribute}>Download ${escapeHtml(config.productName)} ↗</a>`;
  }
  if (section) return `<button class="primary unavailable" type="button" disabled aria-describedby="download-status">Download coming soon</button>`;
  return `<a class="primary" data-download-status href="#download">${compact ? "Download status" : "Download coming soon"} <span aria-hidden="true">↓</span></a>`;
}
