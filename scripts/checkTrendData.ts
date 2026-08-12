import { DEFAULT_SETTINGS } from "../src/model";
import { applyTopN, formatValue, getAxisBreak, getBulletValues, getTrendComparisonKey, getVarianceVisualState, getVisibleBulletNumbers } from "../src/renderer";
import { transformData } from "../src/visual";

const groupSource = { displayName: "省份", roles: { group: true } };
const trendSource = { displayName: "日期", roles: { trend: true } };
const actualSource = { displayName: "销售额", queryName: "Sales", roles: { values: true } };
const previousSource = { displayName: "销售额.PY", queryName: "SalesPY", roles: { previousYear: true } };
const planSource = { displayName: "计划", queryName: "Plan", roles: { plan: true } };

const dataView = {
  metadata: { columns: [groupSource, trendSource, actualSource, previousSource, planSource] },
  categorical: {
    categories: [
      { source: groupSource, values: ["湖北省", "湖北省", "湖北省", "广东省", "广东省"] },
      { source: trendSource, values: ["2021-02-01T00:00:00.000Z", "2021-01-01T00:00:00.000Z", "2021-03-01T00:00:00.000Z", "2021-02-01T00:00:00.000Z", "2021-01-01T00:00:00.000Z"] }
    ],
    values: [
      { source: actualSource, values: [110, 100, null, 120, 90], highlights: [55, null, null, null, null] },
      { source: previousSource, values: [102, 95, 109, 108, 92], highlights: [51, null, null, null, null] },
      { source: planSource, values: [108, 103, 115, 118, 96], highlights: [54, null, null, null, null] }
    ]
  }
} as never;

const host = {
  createSelectionIdBuilder: () => {
    const parts: string[] = [];
    const builder = {
      withCategory: (column: { source: { displayName: string } }, rowIndex: number) => {
        parts.push(`${column.source.displayName}-${rowIndex}`);
        return builder;
      },
      createSelectionId: () => ({
        getKey: () => parts.join("/"),
        includes: (other: { getKey?: () => string }) => parts.join("/").includes(other.getKey?.() ?? "never")
      })
    };
    return builder;
  }
} as never;

const cards = transformData(dataView, host, DEFAULT_SETTINGS);
if (cards.length !== 2 || cards.map(card => card.points.length).join(",") !== "3,2") {
  throw new Error(`趋势转换失败：${cards.map(card => `${card.title}:${card.points.length}`).join(", ")}`);
}

const hubei = cards.find(card => card.title === "湖北省")!;
if (hubei.points.map(point => point.sourceIndex).join(",") !== "1,0,2") {
  throw new Error(`趋势日期没有正确排序：${hubei.points.map(point => point.sourceIndex).join(",")}`);
}
if (hubei.value !== 110 || hubei.previous !== 102 || hubei.plan !== 108) {
  throw new Error(`最新有效期间没有对齐：AC=${hubei.value}, PY=${hubei.previous}, PL=${hubei.plan}`);
}
if (!hubei.hasHighlights || hubei.highlightedValue !== 55 || hubei.points[1].actualHighlight !== 55) {
  throw new Error("Power BI highlights 没有正确转换到卡片和趋势点。");
}
if (hubei.selectionIds?.length !== 3 || hubei.points.some(point => !point.selectionId)) {
  throw new Error("卡片和趋势点必须保留各自的选择身份。");
}
if (hubei.points.some(point => point.category.includes("T"))) {
  throw new Error("ISO 日期没有格式化为可读标签。");
}
if (getTrendComparisonKey(hubei.points) !== "plan") {
  throw new Error("有计划值时必须显示计划比较线。");
}
const bullet = getBulletValues(hubei.points);
if (bullet.actual !== 110 || bullet.plan !== 108 || bullet.previous !== 102) {
  throw new Error(`子弹图比较期间没有对齐：${JSON.stringify(bullet)}`);
}

const neutralState = getVarianceVisualState(101, 100, { invertNegative: false, neutralTolerancePercent: 2, scaleVarianceIcons: true }, .2);
const positiveState = getVarianceVisualState(120, 100, { invertNegative: false, neutralTolerancePercent: 2, scaleVarianceIcons: true }, .2);
const invertedState = getVarianceVisualState(120, 100, { invertNegative: true, neutralTolerancePercent: 2, scaleVarianceIcons: false }, .2);
if (neutralState.state !== "neutral" || positiveState.state !== "positive" || invertedState.state !== "negative") {
  throw new Error("差异的正向、负向或中性语义错误。");
}
if (Math.abs(positiveState.scale - 1.4) > 1e-9 || neutralState.scale < .65 || neutralState.scale > 1.4) {
  throw new Error(`差异图标缩放超出范围：neutral=${neutralState.scale}, max=${positiveState.scale}`);
}

const sumCard = transformData(dataView, host, { ...DEFAULT_SETTINGS, valueMode: "sum" }).find(card => card.title === "湖北省")!;
if (sumCard.value !== 210 || sumCard.highlightedValue !== 55) {
  throw new Error(`合计模式错误：value=${sumCard.value}, highlight=${sumCard.highlightedValue}`);
}
const sumBullet = getBulletValues(sumCard);
if (sumBullet.actual !== 210 || sumBullet.previous !== 306 || sumBullet.plan !== 326) {
  throw new Error(`合计模式下子弹图与卡片口径不一致：${JSON.stringify(sumBullet)}`);
}
if (formatValue(4980000000, "", "hundredMillions", 1) !== "49.8亿" || formatValue(4980000000, "", "billions", 2) !== "4.98B" || formatValue(4980, "", "none", 0) !== "4,980") {
  throw new Error("显示单位或小数位格式化错误。");
}
const visibleBulletNumbers = getVisibleBulletNumbers({ actual: 100, plan: 130, previous: 90, forecast: 150 }, { showBulletPlanMarker: false, showBulletPreviousMarker: true, showBulletForecastMarker: false });
if (visibleBulletNumbers.join(",") !== "0,100,90") {
  throw new Error(`隐藏的子弹图标记仍在影响刻度：${visibleBulletNumbers.join(",")}`);
}

const topN = applyTopN(cards, { topN: 1, topNBy: "value", showOthers: true });
if (topN.length !== 2 || topN[1].title !== "其他" || topN[1].value !== 110 || topN[1].selectionIds?.length !== 3) {
  throw new Error(`Top N + 其他汇总错误：${JSON.stringify(topN.map(card => ({ title: card.title, value: card.value, ids: card.selectionIds?.length })))}`);
}
const repeatedTopN = applyTopN(topN, { topN: 1, topNBy: "value", showOthers: true });
if (repeatedTopN.length !== 2 || repeatedTopN.filter(card => card.title === "其他").length !== 1 || repeatedTopN[1].value !== 110) {
  throw new Error(`重复计算 Top N 后出现多个“其他”：${JSON.stringify(repeatedTopN.map(card => ({ title: card.title, value: card.value })))}`);
}
const sourceOther = { ...cards[0], key: "source-other", title: "其他", value: 50, isOthers: false };
const topNWithSourceOther = applyTopN([...cards, sourceOther], { topN: 1, topNBy: "value", showOthers: true });
if (topNWithSourceOther.length !== 2 || topNWithSourceOther.filter(card => card.title === "其他").length !== 1 || topNWithSourceOther[1].value !== 160) {
  throw new Error(`源数据中的“其他”没有与 Top N 余项合并：${JSON.stringify(topNWithSourceOther.map(card => ({ title: card.title, value: card.value })))}`);
}
const sourceOtherWithoutAggregation = applyTopN([{ ...sourceOther, value: 500 }, ...cards], { topN: 1, topNBy: "value", showOthers: false });
if (sourceOtherWithoutAggregation.length !== 1 || sourceOtherWithoutAggregation[0].title !== "其他" || sourceOtherWithoutAggregation[0].value !== 500) {
  throw new Error(`关闭汇总后，源数据中的“其他”没有正常参与 Top N：${JSON.stringify(sourceOtherWithoutAggregation)}`);
}
if (!getAxisBreak(90, 100, { autoAxisBreak: true, axisBreakThresholdPercent: 20 }) || getAxisBreak(10, 100, { autoAxisBreak: true, axisBreakThresholdPercent: 20 })) {
  throw new Error("自动断轴判断错误。");
}

console.log("趋势、联动、Top N、缩放与断轴数据逻辑均通过验证。");
