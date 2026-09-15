const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("overview map contains only Egypt destinations and uses an existing map template", () => {
  const data = JSON.parse(read("trip-data.json"));
  const overview = data.routeMap.regions.find((region) => region.id === "overview");
  assert.equal(overview.templateId, "coastal-region");
  assert.match(overview.baseImage, /^assets\/maps\/templates\//);
  assert.equal(overview.places.some((place) => /beijing|北京/i.test(`${place.id} ${place.nameZh || ""}`)), false);
  assert.equal(overview.routes.some((route) => route.placeIds.some((id) => id === "city-beijing")), false);
});

test("daily map keeps colored route paths instead of deleting them with the route groups", () => {
  const routeUi = read("route-ui.js");
  const overviewMap = read("overview-map.js");
  assert.match(routeUi, /querySelectorAll\('g\[id\^="overview-route-"\]'\)/);
  assert.match(routeUi, /group\.dataset\.day !== String\(selected\.day\)/);
  assert.match(overviewMap, /data-day="\$\{route\.day\}"/);
});

test("daily map layout merges every route segment that occurs on the same day", () => {
  const data = JSON.parse(read("trip-data.json"));
  const overview = data.routeMap.regions.find((region) => region.id === "overview");
  assert.deepEqual(overview.dailyLayouts["7"].places, ["city-soma-bay", "city-hurghada", "city-cairo"]);
});

test("driving module is disabled while transfer information remains in itinerary", () => {
  const data = JSON.parse(read("trip-data.json"));
  assert.equal(data.config.modules.driving, false);
  assert.equal(data.days.some((day) => day.schedule.some((item) => /包车/.test(item.text))), true);
});

test("travel navigation separates the direct home link from the submenu toggle", () => {
  const html = read("index.html");
  assert.match(html, /id="travel-navigation-home" href="#top"/);
  assert.match(html, /id="travel-navigation-details"/);
  assert.match(html, /id="travel-navigation-trigger"/);
  assert.doesNotMatch(html, /data-module="driving"[^>]*>自驾</);
});

test("new destination uses an in-page form instead of prompt dialogs", () => {
  const html = read("index.html");
  const app = read("app.js");
  assert.match(html, /id="destination-dialog"/);
  assert.match(html, /id="destination-form"/);
  assert.match(app, /function openDestinationDialog/);
  assert.match(app, /function submitDestination/);
  assert.doesNotMatch(app, /\bprompt\s*\(/);
});
