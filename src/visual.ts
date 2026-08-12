/// <reference path="./styles.d.ts" />
import type powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "../style/visual.less";
import { CardsRenderer } from "./renderer";
import { CardSettings, DEFAULT_SETTINGS, KpiCard, TrendPoint } from "./model";
import { toCardSettings, VisualFormattingSettingsModel } from "./formattingSettings";

type IVisual = powerbi.extensibility.visual.IVisual;
type VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type DataView = powerbi.DataView;
type DataViewCategorical = powerbi.DataViewCategorical;
type DataViewValueColumn = powerbi.DataViewValueColumn;
type DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
type PrimitiveValue = powerbi.PrimitiveValue;
type HighlightValue = powerbi.PrimitiveValue;

export class Visual implements IVisual {
  private host: powerbi.extensibility.visual.IVisualHost;
  private renderer: CardsRenderer;
  private selectionManager: powerbi.extensibility.ISelectionManager;
  private settings: CardSettings = { ...DEFAULT_SETTINGS };
  private formattingSettings = new VisualFormattingSettingsModel();
  private formattingSettingsService = new FormattingSettingsService();

  constructor(options: VisualConstructorOptions | undefined) {
    if (!options) throw new Error("Visual constructor options are required.");
    this.host = options.host;
    this.selectionManager = this.host.createSelectionManager();
    this.renderer = new CardsRenderer(options.element, {
      onSelect: (card, multi, isSelected) => {
        if (this.host.hostCapabilities.allowInteractions === false) return;
        const selectionIds = (card.selectionIds?.length ? card.selectionIds : [card.selectionId])
          .filter((id): id is powerbi.visuals.ISelectionId => Boolean(id));
        if (!selectionIds.length) return;
        if (isSelected && !multi) {
          void this.selectionManager.clear().then(() => this.renderer.syncSelection([]));
        } else {
          void this.selectionManager.select(selectionIds, multi).then(ids => this.renderer.syncSelection(ids));
        }
      },
      onClearSelection: () => {
        if (this.host.hostCapabilities.allowInteractions === false) return;
        void this.selectionManager.clear().then(() => this.renderer.syncSelection([]));
      },
      onContextMenu: (card, point, x, y) => {
        if (this.host.hostCapabilities.allowInteractions === false) return;
        const selectionId = (point?.selectionId ?? card.selectionId) as powerbi.visuals.ISelectionId | undefined;
        if (selectionId && this.selectionManager.showContextMenu) {
          this.selectionManager.showContextMenu(selectionId, { x, y });
        }
      }
    });
    this.selectionManager.registerOnSelectCallback(ids => this.renderer.syncSelection(ids));
  }

  public update(options: VisualUpdateOptions): void {
    const dataView = options.dataViews?.[0];
    if (dataView) {
      this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);
      this.settings = toCardSettings(this.formattingSettings);
    }
    this.renderer.render(dataView ? transformData(dataView, this.host, this.settings) : [], this.settings);
    this.renderer.syncSelection(this.selectionManager.getSelectionIds());
  }

  public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
    const selector = {} as powerbi.data.Selector;
    if (options.objectName === "general") return [{ objectName: "general", selector, properties: { layout: this.settings.layout, maxCardsInRow: this.settings.maxCardsInRow, scaleCharts: this.settings.scaleCharts, valueMode: this.settings.valueMode, sortMode: this.settings.sortMode } }];
    if (options.objectName === "card") return [{ objectName: "card", selector, properties: { showVariance: this.settings.showVariance, chartType: this.settings.chartType, valueAlignment: this.settings.valueAlignment, variancePosition: this.settings.variancePosition, suppressChart: this.settings.suppressChart, wrapTitle: this.settings.wrapTitle, invertNegative: this.settings.invertNegative } }];
    if (options.objectName === "style") return [{ objectName: "style", selector, properties: { cardStyle: this.settings.cardStyle, fontFamily: this.settings.fontFamily, spacing: this.settings.spacing, showToolbar: this.settings.showToolbar, goodColor: { solid: { color: this.settings.goodColor } }, badColor: { solid: { color: this.settings.badColor } }, actualColor: { solid: { color: this.settings.actualColor } }, comparisonColor: { solid: { color: this.settings.comparisonColor } } } }];
    return [];
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }
}

export function transformData(dataView: DataView, host: powerbi.extensibility.visual.IVisualHost, settings: CardSettings): KpiCard[] {
  const categorical = dataView.categorical;
  if (!categorical?.values?.length) return [];
  const categories = categorical.categories ?? [];
  const groupColumn = roleCategory(categories, "group");
  const trendColumn = roleCategory(categories, "trend");
  const commentCategory = roleCategory(categories, "comments");
  const tooltipCategory = roleCategory(categories, "tooltips");
  const actualColumns = roleValues(categorical, "values");
  if (!actualColumns.length) return [];
  const previousColumn = roleValues(categorical, "previousYear")[0];
  const planColumn = roleValues(categorical, "plan")[0];
  const forecastColumn = roleValues(categorical, "forecast")[0];
  const commentValue = roleValues(categorical, "comments")[0];
  const tooltipValues = roleValues(categorical, "tooltips");

  if (!groupColumn) {
    return actualColumns.map((column, measureIndex) => buildCard(
      String(column.source.displayName ?? `KPI ${measureIndex + 1}`),
      column,
      column.values.map((_, index) => index),
      trendColumn,
      previousColumn,
      planColumn,
      forecastColumn,
      commentCategory,
      commentValue,
      tooltipCategory,
      tooltipValues,
      [],
      settings,
      undefined,
      [],
      column.values.map((_, index) => createSelectionId(host, [trendColumn], index))
    ));
  }

  const groups = new Map<string, number[]>();
  groupColumn.values.forEach((raw, index) => {
    const key = String(raw ?? "(Blank)");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(index);
  });

  return [...groups.entries()].map(([title, indices]) => {
    const selectionIds: powerbi.visuals.ISelectionId[] = [];
    for (const index of indices) {
      try {
        const selectionId = host.createSelectionIdBuilder().withCategory(groupColumn, index).createSelectionId();
        if (!selectionIds.some(existing => existing.getKey() === selectionId.getKey())) selectionIds.push(selectionId);
      } catch { /* Ignore unavailable identities. */ }
    }
    const pointSelectionIds = indices.map(index => createSelectionId(host, [groupColumn, trendColumn], index));
    return buildCard(title, actualColumns[0], indices, trendColumn, previousColumn, planColumn, forecastColumn, commentCategory, commentValue, tooltipCategory, tooltipValues, actualColumns.slice(1), settings, selectionIds[0], selectionIds, pointSelectionIds);
  });
}

function buildCard(title: string, actualColumn: DataViewValueColumn, indices: number[], trendColumn: DataViewCategoryColumn | undefined, previousColumn: DataViewValueColumn | undefined, planColumn: DataViewValueColumn | undefined, forecastColumn: DataViewValueColumn | undefined, commentCategory: DataViewCategoryColumn | undefined, commentValue: DataViewValueColumn | undefined, tooltipCategory: DataViewCategoryColumn | undefined, tooltipValues: DataViewValueColumn[], secondaryColumns: DataViewValueColumn[], settings: CardSettings, selectionId: unknown, selectionIds: unknown[] = selectionId ? [selectionId] : [], pointSelectionIds: Array<unknown | undefined> = []): KpiCard {
  const points: TrendPoint[] = indices.map((index, pointIndex) => {
    const rawCategory = trendColumn?.values[index];
    return {
      category: formatCategory(rawCategory, pointIndex + 1),
      sortValue: categorySortValue(rawCategory, pointIndex),
      sourceIndex: index,
      actual: numeric(actualColumn.values[index]),
      previous: numeric(previousColumn?.values[index]),
      plan: numeric(planColumn?.values[index]),
      forecast: numeric(forecastColumn?.values[index]),
      actualHighlight: numericHighlight(actualColumn.highlights?.[index]),
      previousHighlight: numericHighlight(previousColumn?.highlights?.[index]),
      planHighlight: numericHighlight(planColumn?.highlights?.[index]),
      forecastHighlight: numericHighlight(forecastColumn?.highlights?.[index]),
      selectionId: pointSelectionIds[pointIndex],
      comment: stringValue(commentCategory?.values[index] ?? commentValue?.values[index]),
      tooltip: [tooltipCategory?.values[index], ...tooltipValues.map(column => `${column.source.displayName}: ${stringValue(column.values[index]) ?? ""}`)].filter(Boolean).join("\n")
    };
  }).sort(compareTrendPoints);
  const latestActualPoint = [...points].reverse().find(point => point.actual != null);
  const latestHighlightPoint = [...points].reverse().find(point => point.actualHighlight != null);
  const aggregate = (column: DataViewValueColumn | undefined, pointKey?: "actual" | "previous" | "plan" | "forecast"): number | null => {
    if (!column) return null;
    const numbers = indices.map(index => numeric(column.values[index])).filter(isNumber);
    if (!numbers.length) return null;
    if (settings.valueMode === "sum") return numbers.reduce((a, b) => a + b, 0);
    if (pointKey && latestActualPoint) return latestActualPoint[pointKey] ?? null;
    if (latestActualPoint?.sourceIndex != null) return numeric(column.values[latestActualPoint.sourceIndex]);
    return numbers[numbers.length - 1];
  };
  const latestComment = [...points].reverse().find(point => point.comment)?.comment;
  const hasHighlights = [actualColumn, previousColumn, planColumn, forecastColumn].some(column => Boolean(column?.highlights));
  const highlightedValue = settings.valueMode === "sum"
    ? sumHighlights(actualColumn.highlights)
    : latestHighlightPoint?.actualHighlight ?? null;
  return {
    key: `${title}-${actualColumn.source.queryName ?? actualColumn.source.displayName}`,
    title,
    value: aggregate(actualColumn, "actual"),
    previous: aggregate(previousColumn, "previous"),
    plan: aggregate(planColumn, "plan"),
    forecast: aggregate(forecastColumn, "forecast"),
    highlightedValue,
    hasHighlights,
    format: actualColumn.source.format,
    points,
    secondary: secondaryColumns.map(column => ({ label: String(column.source.displayName), value: aggregate(column), format: column.source.format })),
    comment: latestComment,
    selectionId,
    selectionIds
  };
}

function roleCategory(categories: DataViewCategoryColumn[], role: string): DataViewCategoryColumn | undefined {
  return categories.find(column => column.source.roles?.[role]);
}

function roleValues(categorical: DataViewCategorical, role: string): DataViewValueColumn[] {
  return (categorical.values ? Array.from(categorical.values) : []).filter(column => column.source.roles?.[role]);
}

function createSelectionId(host: powerbi.extensibility.visual.IVisualHost, columns: Array<DataViewCategoryColumn | undefined>, index: number): powerbi.visuals.ISelectionId | undefined {
  try {
    const builder = host.createSelectionIdBuilder();
    let hasCategory = false;
    for (const column of columns) {
      if (!column) continue;
      builder.withCategory(column, index);
      hasCategory = true;
    }
    return hasCategory ? builder.createSelectionId() : undefined;
  } catch {
    return undefined;
  }
}

function numeric(value: PrimitiveValue | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericHighlight(value: HighlightValue | undefined): number | null {
  return numeric(value);
}

function sumHighlights(values: HighlightValue[] | undefined): number | null {
  if (!values) return null;
  const numbers = values.map(numericHighlight).filter(isNumber);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) : null;
}

function categorySortValue(value: PrimitiveValue | undefined, fallback: number): number | string {
  if (value == null) return fallback;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const date = Date.parse(text);
  return Number.isNaN(date) ? text : date;
}

function compareTrendPoints(a: TrendPoint, b: TrendPoint): number {
  if (typeof a.sortValue === "number" && typeof b.sortValue === "number") return a.sortValue - b.sortValue;
  return String(a.sortValue ?? a.category).localeCompare(String(b.sortValue ?? b.category), undefined, { numeric: true });
}

function stringValue(value: PrimitiveValue | undefined): string | undefined {
  return value == null ? undefined : String(value);
}

function formatCategory(value: PrimitiveValue | undefined, fallback: number): string {
  if (value == null) return String(fallback);
  const text = String(value);
  const looksLikeIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text);
  if (value instanceof Date || looksLikeIsoDate) {
    const date = value instanceof Date ? value : new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    }
  }
  return text;
}

function isNumber(value: number | null): value is number { return value != null; }
