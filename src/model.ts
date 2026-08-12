export type LayoutMode = "grid" | "row";
export type ChartType = "area" | "line" | "waterfall" | "variance" | "bullet";
export type VarianceMode = "both" | "relative" | "absolute" | "none";
export type SortMode = "valueDesc" | "valueAsc" | "varianceDesc" | "varianceAsc" | "titleAsc" | "titleDesc" | "original";
export type ScaleMode = "independent" | "all" | "group";
export type TopNBy = "value" | "variance";
export type DisplayUnits = "auto" | "none" | "thousands" | "tenThousands" | "millions" | "hundredMillions" | "billions";

export interface CardSettings {
  layout: LayoutMode;
  maxCardsInRow: number;
  scaleCharts: boolean;
  scaleMode: ScaleMode;
  valueMode: "latest" | "sum";
  sortMode: SortMode;
  topN: number;
  topNBy: TopNBy;
  showOthers: boolean;
  showVariance: VarianceMode;
  chartType: ChartType;
  valueAlignment: "left" | "center" | "right";
  variancePosition: "right" | "below";
  suppressChart: boolean;
  wrapTitle: boolean;
  invertNegative: boolean;
  scaleVarianceIcons: boolean;
  neutralTolerancePercent: number;
  cardStyle: "shadow" | "outlined" | "flat";
  fontFamily: string;
  spacing: number;
  showToolbar: boolean;
  goodColor: string;
  badColor: string;
  actualColor: string;
  comparisonColor: string;
  forecastColor: string;
  neutralColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardCornerRadius: number;
  showTitle: boolean;
  titlePosition: "top" | "above" | "below";
  titleAlignment: "left" | "center" | "right";
  titleFontSize: number;
  titleColor: string;
  titleBold: boolean;
  showValue: boolean;
  displayUnits: DisplayUnits;
  decimalPlaces: number;
  valueFontSize: number;
  valueColor: string;
  valueBold: boolean;
  varianceFontSize: number;
  varianceLabelColor: string;
  commentColor: string;
  chartHeight: number;
  chartLineWidth: number;
  showAxisLabels: boolean;
  autoAxisBreak: boolean;
  axisBreakThresholdPercent: number;
  axisFontSize: number;
  axisColor: string;
  selectedBorderColor: string;
  selectedBackgroundColor: string;
  selectedBorderWidth: number;
  dimUnselected: boolean;
  unselectedOpacity: number;
}

export interface TrendPoint {
  category: string;
  sortValue?: number | string;
  sourceIndex?: number;
  actual: number | null;
  previous: number | null;
  plan: number | null;
  forecast: number | null;
  actualHighlight?: number | null;
  previousHighlight?: number | null;
  planHighlight?: number | null;
  forecastHighlight?: number | null;
  selectionId?: unknown;
  comment?: string;
  tooltip?: string;
}

export interface KpiCard {
  key: string;
  title: string;
  scaleGroup?: string;
  value: number | null;
  previous: number | null;
  plan: number | null;
  forecast: number | null;
  highlightedValue?: number | null;
  hasHighlights?: boolean;
  format?: string;
  points: TrendPoint[];
  secondary: Array<{ label: string; value: number | null; format?: string }>;
  comment?: string;
  selectionId?: unknown;
  selectionIds?: unknown[];
  isOthers?: boolean;
}

export const DEFAULT_SETTINGS: CardSettings = {
  layout: "grid",
  maxCardsInRow: 4,
  scaleCharts: false,
  scaleMode: "independent",
  valueMode: "latest",
  sortMode: "valueDesc",
  topN: 0,
  topNBy: "value",
  showOthers: true,
  showVariance: "both",
  chartType: "area",
  valueAlignment: "center",
  variancePosition: "right",
  suppressChart: false,
  wrapTitle: false,
  invertNegative: false,
  scaleVarianceIcons: true,
  neutralTolerancePercent: 0,
  cardStyle: "shadow",
  fontFamily: "Segoe UI, Arial, sans-serif",
  spacing: 8,
  showToolbar: true,
  goodColor: "#62c900",
  badColor: "#ee2b2b",
  actualColor: "#2f2f2f",
  comparisonColor: "#9b9b9b",
  forecastColor: "#606060",
  neutralColor: "#808080",
  cardBackgroundColor: "#ffffff",
  cardBorderColor: "#dedede",
  cardBorderWidth: 1,
  cardCornerRadius: 0,
  showTitle: true,
  titlePosition: "top",
  titleAlignment: "left",
  titleFontSize: 13,
  titleColor: "#3d3d3d",
  titleBold: true,
  showValue: true,
  displayUnits: "auto",
  decimalPlaces: -1,
  valueFontSize: 34,
  valueColor: "#333333",
  valueBold: false,
  varianceFontSize: 12,
  varianceLabelColor: "#777777",
  commentColor: "#1476c9",
  chartHeight: 64,
  chartLineWidth: 2.4,
  showAxisLabels: true,
  autoAxisBreak: false,
  axisBreakThresholdPercent: 35,
  axisFontSize: 10,
  axisColor: "#666666",
  selectedBorderColor: "#f2c811",
  selectedBackgroundColor: "#fff4bf",
  selectedBorderWidth: 3,
  dimUnselected: true,
  unselectedOpacity: 35
};
