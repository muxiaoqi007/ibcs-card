export type LayoutMode = "grid" | "row";
export type ChartType = "area" | "line" | "waterfall" | "variance";
export type VarianceMode = "both" | "relative" | "absolute" | "none";
export type SortMode = "valueDesc" | "valueAsc" | "varianceDesc" | "varianceAsc" | "titleAsc" | "titleDesc" | "original";

export interface CardSettings {
  layout: LayoutMode;
  maxCardsInRow: number;
  scaleCharts: boolean;
  valueMode: "latest" | "sum";
  sortMode: SortMode;
  showVariance: VarianceMode;
  chartType: ChartType;
  valueAlignment: "left" | "center" | "right";
  variancePosition: "right" | "below";
  suppressChart: boolean;
  wrapTitle: boolean;
  invertNegative: boolean;
  cardStyle: "shadow" | "outlined" | "flat";
  fontFamily: string;
  spacing: number;
  showToolbar: boolean;
  goodColor: string;
  badColor: string;
  actualColor: string;
  comparisonColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardCornerRadius: number;
  showTitle: boolean;
  titleFontSize: number;
  titleColor: string;
  titleBold: boolean;
  showValue: boolean;
  valueFontSize: number;
  valueColor: string;
  valueBold: boolean;
  varianceFontSize: number;
  varianceLabelColor: string;
  commentColor: string;
  chartHeight: number;
  chartLineWidth: number;
  showAxisLabels: boolean;
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
  actual: number | null;
  previous: number | null;
  plan: number | null;
  forecast: number | null;
  comment?: string;
  tooltip?: string;
}

export interface KpiCard {
  key: string;
  title: string;
  value: number | null;
  previous: number | null;
  plan: number | null;
  forecast: number | null;
  format?: string;
  points: TrendPoint[];
  secondary: Array<{ label: string; value: number | null; format?: string }>;
  comment?: string;
  selectionId?: unknown;
  selectionIds?: unknown[];
}

export const DEFAULT_SETTINGS: CardSettings = {
  layout: "grid",
  maxCardsInRow: 4,
  scaleCharts: false,
  valueMode: "latest",
  sortMode: "valueDesc",
  showVariance: "both",
  chartType: "area",
  valueAlignment: "center",
  variancePosition: "right",
  suppressChart: false,
  wrapTitle: false,
  invertNegative: false,
  cardStyle: "shadow",
  fontFamily: "Segoe UI, Arial, sans-serif",
  spacing: 8,
  showToolbar: true,
  goodColor: "#62c900",
  badColor: "#ee2b2b",
  actualColor: "#2f2f2f",
  comparisonColor: "#9b9b9b",
  cardBackgroundColor: "#ffffff",
  cardBorderColor: "#dedede",
  cardBorderWidth: 1,
  cardCornerRadius: 0,
  showTitle: true,
  titleFontSize: 13,
  titleColor: "#3d3d3d",
  titleBold: true,
  showValue: true,
  valueFontSize: 34,
  valueColor: "#333333",
  valueBold: false,
  varianceFontSize: 12,
  varianceLabelColor: "#777777",
  commentColor: "#1476c9",
  chartHeight: 64,
  chartLineWidth: 2.4,
  showAxisLabels: true,
  axisFontSize: 10,
  axisColor: "#666666",
  selectedBorderColor: "#f2c811",
  selectedBackgroundColor: "#fff4bf",
  selectedBorderWidth: 3,
  dimUnselected: true,
  unselectedOpacity: 35
};
