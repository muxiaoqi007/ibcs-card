import { DEFAULT_SETTINGS } from "../src/model";
import { getTrendComparisonKey } from "../src/renderer";
import { transformData } from "../src/visual";

const groupSource = { displayName: "Province", roles: { group: true } };
const trendSource = { displayName: "Date", roles: { trend: true } };
const actualSource = { displayName: "Sales", queryName: "Sales", roles: { values: true } };
const previousSource = { displayName: "Sales PY", queryName: "SalesPY", roles: { previousYear: true } };

const dataView = {
  metadata: { columns: [groupSource, trendSource, actualSource, previousSource] },
  categorical: {
    categories: [
      { source: groupSource, values: ["湖北省", "湖北省", "广东省", "广东省"] },
      { source: trendSource, values: ["2021-01-01T00:00:00.000Z", "2021-02-01T00:00:00.000Z", "2021-01-01T00:00:00.000Z", "2021-02-01T00:00:00.000Z"] }
    ],
    values: [
      { source: actualSource, values: [100, 110, 90, 120] },
      { source: previousSource, values: [95, 102, 92, 108] }
    ]
  }
} as never;

const selectionId = { key: "selection" };
const host = {
  createSelectionIdBuilder: () => ({
    withCategory: () => ({ createSelectionId: () => selectionId })
  })
} as never;

const cards = transformData(dataView, host, DEFAULT_SETTINGS);
if (cards.length !== 2 || cards.some(card => card.points.length !== 2)) {
  throw new Error(`Trend transformation failed: ${cards.map(card => `${card.title}:${card.points.length}`).join(", ")}`);
}
if (cards[0].points.some(point => point.category.includes("T"))) {
  throw new Error("ISO trend categories were not formatted as readable dates.");
}
if (getTrendComparisonKey(cards[0].points) !== null) {
  throw new Error("Previous-year values must not create a second trend line.");
}

cards[0].points[0].plan = 105;
if (getTrendComparisonKey(cards[0].points) !== "plan") {
  throw new Error("Plan values must create the comparison trend line.");
}

console.log("Trend data produces multiple points per KPI card.");
