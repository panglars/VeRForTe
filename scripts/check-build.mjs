import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Check rendered output: a successful SSG build can still produce error pages.
async function checkReports(locale) {
  const root = join("dist", locale, "reports");
  const entries = await readdir(root, { withFileTypes: true });
  const routes = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.ok(routes.length > 0, `No report pages found in ${root}`);
  for (const route of routes) {
    const path = join(root, route, "index.html");
    const html = await readFile(path, "utf8");
    assert.ok(html.includes("prose prose-slate"), `Missing report body: ${path}`);
    assert.ok(!/System information for|未找到系统|No detailed information available/.test(html), `Report error page: ${path}`);
    assert.ok(html.includes("github.com/ruyisdk/support-matrix/blob/main/"), `Missing source link: ${path}`);
  }
  return routes;
}

const english = await checkReports("");
const chinese = await checkReports("zh-CN");
assert.deepEqual(chinese, english, "English and Chinese report URLs must use the same identifiers");
console.log(`Validated ${english.length + chinese.length} report pages and matching locale routes.`);
