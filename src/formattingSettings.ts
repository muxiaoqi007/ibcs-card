import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { CardSettings, ChartType, DEFAULT_SETTINGS, LayoutMode, SortMode, VarianceMode } from "./model";

class GeneralCardSettings extends formattingSettings.SimpleCard {
  layout = new formattingSettings.AutoDropdown({
    name: "layout",
    displayName: "布局方式",
    value: DEFAULT_SETTINGS.layout
  });

  maxCardsInRow = new formattingSettings.NumUpDown({
    name: "maxCardsInRow",
    displayName: "每行最多卡片数",
    value: DEFAULT_SETTINGS.maxCardsInRow
  });

  scaleCharts = new formattingSettings.ToggleSwitch({
    name: "scaleCharts",
    displayName: "统一趋势图刻度",
    value: DEFAULT_SETTINGS.scaleCharts
  });

  valueMode = new formattingSettings.AutoDropdown({
    name: "valueMode",
    displayName: "主值计算方式",
    value: DEFAULT_SETTINGS.valueMode
  });

  sortMode = new formattingSettings.AutoDropdown({
    name: "sortMode",
    displayName: "卡片排序",
    value: DEFAULT_SETTINGS.sortMode
  });

  name = "general";
  displayName = "常规";
  slices = [this.layout, this.maxCardsInRow, this.scaleCharts, this.valueMode, this.sortMode];
}

class CardCardSettings extends formattingSettings.SimpleCard {
  showVariance = new formattingSettings.AutoDropdown({
    name: "showVariance",
    displayName: "差异显示",
    value: DEFAULT_SETTINGS.showVariance
  });

  chartType = new formattingSettings.AutoDropdown({
    name: "chartType",
    displayName: "图表类型",
    value: DEFAULT_SETTINGS.chartType
  });

  valueAlignment = new formattingSettings.AutoDropdown({
    name: "valueAlignment",
    displayName: "主值对齐",
    value: DEFAULT_SETTINGS.valueAlignment
  });

  variancePosition = new formattingSettings.AutoDropdown({
    name: "variancePosition",
    displayName: "差异值位置",
    value: DEFAULT_SETTINGS.variancePosition
  });

  suppressChart = new formattingSettings.ToggleSwitch({
    name: "suppressChart",
    displayName: "隐藏趋势图",
    value: DEFAULT_SETTINGS.suppressChart
  });

  wrapTitle = new formattingSettings.ToggleSwitch({
    name: "wrapTitle",
    displayName: "卡片标题换行",
    value: DEFAULT_SETTINGS.wrapTitle
  });

  invertNegative = new formattingSettings.ToggleSwitch({
    name: "invertNegative",
    displayName: "反转指标含义",
    value: DEFAULT_SETTINGS.invertNegative
  });

  name = "card";
  displayName = "卡片";
  slices = [this.showVariance, this.chartType, this.valueAlignment, this.variancePosition, this.suppressChart, this.wrapTitle, this.invertNegative];
}

class StyleCardSettings extends formattingSettings.SimpleCard {
  cardStyle = new formattingSettings.AutoDropdown({
    name: "cardStyle",
    displayName: "卡片样式",
    value: DEFAULT_SETTINGS.cardStyle
  });

  fontFamily = new formattingSettings.FontPicker({
    name: "fontFamily",
    displayName: "字体",
    value: DEFAULT_SETTINGS.fontFamily
  });

  spacing = new formattingSettings.NumUpDown({
    name: "spacing",
    displayName: "卡片间距",
    value: DEFAULT_SETTINGS.spacing
  });

  showToolbar = new formattingSettings.ToggleSwitch({
    name: "showToolbar",
    displayName: "显示悬浮工具栏",
    value: DEFAULT_SETTINGS.showToolbar
  });

  goodColor = new formattingSettings.ColorPicker({
    name: "goodColor",
    displayName: "正向颜色",
    value: { value: DEFAULT_SETTINGS.goodColor }
  });

  badColor = new formattingSettings.ColorPicker({
    name: "badColor",
    displayName: "负向颜色",
    value: { value: DEFAULT_SETTINGS.badColor }
  });

  actualColor = new formattingSettings.ColorPicker({
    name: "actualColor",
    displayName: "实际值颜色",
    value: { value: DEFAULT_SETTINGS.actualColor }
  });

  comparisonColor = new formattingSettings.ColorPicker({
    name: "comparisonColor",
    displayName: "对比线颜色",
    value: { value: DEFAULT_SETTINGS.comparisonColor }
  });

  cardBackgroundColor = new formattingSettings.ColorPicker({
    name: "cardBackgroundColor",
    displayName: "卡片背景",
    value: { value: DEFAULT_SETTINGS.cardBackgroundColor }
  });

  cardBorderColor = new formattingSettings.ColorPicker({
    name: "cardBorderColor",
    displayName: "卡片边框",
    value: { value: DEFAULT_SETTINGS.cardBorderColor }
  });

  cardBorderWidth = new formattingSettings.NumUpDown({
    name: "cardBorderWidth",
    displayName: "边框宽度",
    value: DEFAULT_SETTINGS.cardBorderWidth
  });

  cardCornerRadius = new formattingSettings.NumUpDown({
    name: "cardCornerRadius",
    displayName: "圆角",
    value: DEFAULT_SETTINGS.cardCornerRadius
  });

  name = "style";
  displayName = "卡片样式";
  slices = [this.cardStyle, this.fontFamily, this.spacing, this.showToolbar, this.cardBackgroundColor, this.cardBorderColor, this.cardBorderWidth, this.cardCornerRadius, this.goodColor, this.badColor, this.actualColor, this.comparisonColor];
}

class TitleStyleSettings extends formattingSettings.SimpleCard {
  showTitle = new formattingSettings.ToggleSwitch({ name: "showTitle", displayName: "显示标题", value: DEFAULT_SETTINGS.showTitle });
  titleFontSize = new formattingSettings.NumUpDown({ name: "titleFontSize", displayName: "字号", value: DEFAULT_SETTINGS.titleFontSize });
  titleColor = new formattingSettings.ColorPicker({ name: "titleColor", displayName: "颜色", value: { value: DEFAULT_SETTINGS.titleColor } });
  titleBold = new formattingSettings.ToggleSwitch({ name: "titleBold", displayName: "加粗", value: DEFAULT_SETTINGS.titleBold });
  name = "titleStyle";
  displayName = "标题";
  slices = [this.showTitle, this.titleFontSize, this.titleColor, this.titleBold];
}

class ValueStyleSettings extends formattingSettings.SimpleCard {
  showValue = new formattingSettings.ToggleSwitch({ name: "showValue", displayName: "显示主值", value: DEFAULT_SETTINGS.showValue });
  valueFontSize = new formattingSettings.NumUpDown({ name: "valueFontSize", displayName: "字号", value: DEFAULT_SETTINGS.valueFontSize });
  valueColor = new formattingSettings.ColorPicker({ name: "valueColor", displayName: "颜色", value: { value: DEFAULT_SETTINGS.valueColor } });
  valueBold = new formattingSettings.ToggleSwitch({ name: "valueBold", displayName: "加粗", value: DEFAULT_SETTINGS.valueBold });
  name = "valueStyle";
  displayName = "主值";
  slices = [this.showValue, this.valueFontSize, this.valueColor, this.valueBold];
}

class VarianceStyleSettings extends formattingSettings.SimpleCard {
  varianceFontSize = new formattingSettings.NumUpDown({ name: "varianceFontSize", displayName: "字号", value: DEFAULT_SETTINGS.varianceFontSize });
  varianceLabelColor = new formattingSettings.ColorPicker({ name: "varianceLabelColor", displayName: "对比标签颜色", value: { value: DEFAULT_SETTINGS.varianceLabelColor } });
  commentColor = new formattingSettings.ColorPicker({ name: "commentColor", displayName: "备注标记颜色", value: { value: DEFAULT_SETTINGS.commentColor } });
  name = "varianceStyle";
  displayName = "差异";
  slices = [this.varianceFontSize, this.varianceLabelColor, this.commentColor];
}

class TrendStyleSettings extends formattingSettings.SimpleCard {
  chartHeight = new formattingSettings.NumUpDown({ name: "chartHeight", displayName: "高度", value: DEFAULT_SETTINGS.chartHeight });
  chartLineWidth = new formattingSettings.NumUpDown({ name: "chartLineWidth", displayName: "线宽", value: DEFAULT_SETTINGS.chartLineWidth });
  showAxisLabels = new formattingSettings.ToggleSwitch({ name: "showAxisLabels", displayName: "显示坐标轴标签", value: DEFAULT_SETTINGS.showAxisLabels });
  axisFontSize = new formattingSettings.NumUpDown({ name: "axisFontSize", displayName: "坐标轴标签字号", value: DEFAULT_SETTINGS.axisFontSize });
  axisColor = new formattingSettings.ColorPicker({ name: "axisColor", displayName: "坐标轴标签颜色", value: { value: DEFAULT_SETTINGS.axisColor } });
  name = "trendStyle";
  displayName = "趋势图";
  slices = [this.chartHeight, this.chartLineWidth, this.showAxisLabels, this.axisFontSize, this.axisColor];
}

class SelectionStyleSettings extends formattingSettings.SimpleCard {
  selectedBorderColor = new formattingSettings.ColorPicker({ name: "selectedBorderColor", displayName: "选中边框颜色", value: { value: DEFAULT_SETTINGS.selectedBorderColor } });
  selectedBackgroundColor = new formattingSettings.ColorPicker({ name: "selectedBackgroundColor", displayName: "选中背景颜色", value: { value: DEFAULT_SETTINGS.selectedBackgroundColor } });
  selectedBorderWidth = new formattingSettings.NumUpDown({ name: "selectedBorderWidth", displayName: "选中边框宽度", value: DEFAULT_SETTINGS.selectedBorderWidth });
  dimUnselected = new formattingSettings.ToggleSwitch({ name: "dimUnselected", displayName: "淡化未选中卡片", value: DEFAULT_SETTINGS.dimUnselected });
  unselectedOpacity = new formattingSettings.NumUpDown({ name: "unselectedOpacity", displayName: "未选中卡片透明度（%）", value: DEFAULT_SETTINGS.unselectedOpacity });
  name = "selectionStyle";
  displayName = "选中状态";
  slices = [this.selectedBorderColor, this.selectedBackgroundColor, this.selectedBorderWidth, this.dimUnselected, this.unselectedOpacity];
}

export class VisualFormattingSettingsModel extends formattingSettings.Model {
  general = new GeneralCardSettings();
  card = new CardCardSettings();
  style = new StyleCardSettings();
  titleStyle = new TitleStyleSettings();
  valueStyle = new ValueStyleSettings();
  varianceStyle = new VarianceStyleSettings();
  trendStyle = new TrendStyleSettings();
  selectionStyle = new SelectionStyleSettings();
  cards = [this.general, this.card, this.style, this.titleStyle, this.valueStyle, this.varianceStyle, this.trendStyle, this.selectionStyle];
}

export function toCardSettings(model: VisualFormattingSettingsModel): CardSettings {
  return {
    layout: model.general.layout.value as LayoutMode,
    maxCardsInRow: clamp(model.general.maxCardsInRow.value, 1, 8),
    scaleCharts: model.general.scaleCharts.value,
    valueMode: model.general.valueMode.value as "latest" | "sum",
    sortMode: model.general.sortMode.value as SortMode,
    showVariance: model.card.showVariance.value as VarianceMode,
    chartType: model.card.chartType.value as ChartType,
    valueAlignment: model.card.valueAlignment.value as CardSettings["valueAlignment"],
    variancePosition: model.card.variancePosition.value as CardSettings["variancePosition"],
    suppressChart: model.card.suppressChart.value,
    wrapTitle: model.card.wrapTitle.value,
    invertNegative: model.card.invertNegative.value,
    cardStyle: model.style.cardStyle.value as CardSettings["cardStyle"],
    fontFamily: model.style.fontFamily.value,
    spacing: clamp(model.style.spacing.value, 0, 32),
    showToolbar: model.style.showToolbar.value,
    goodColor: model.style.goodColor.value.value,
    badColor: model.style.badColor.value.value,
    actualColor: model.style.actualColor.value.value,
    comparisonColor: model.style.comparisonColor.value.value,
    cardBackgroundColor: model.style.cardBackgroundColor.value.value,
    cardBorderColor: model.style.cardBorderColor.value.value,
    cardBorderWidth: clamp(model.style.cardBorderWidth.value, 0, 12),
    cardCornerRadius: clamp(model.style.cardCornerRadius.value, 0, 40),
    showTitle: model.titleStyle.showTitle.value,
    titleFontSize: clamp(model.titleStyle.titleFontSize.value, 6, 72),
    titleColor: model.titleStyle.titleColor.value.value,
    titleBold: model.titleStyle.titleBold.value,
    showValue: model.valueStyle.showValue.value,
    valueFontSize: clamp(model.valueStyle.valueFontSize.value, 8, 120),
    valueColor: model.valueStyle.valueColor.value.value,
    valueBold: model.valueStyle.valueBold.value,
    varianceFontSize: clamp(model.varianceStyle.varianceFontSize.value, 6, 48),
    varianceLabelColor: model.varianceStyle.varianceLabelColor.value.value,
    commentColor: model.varianceStyle.commentColor.value.value,
    chartHeight: clamp(model.trendStyle.chartHeight.value, 24, 300),
    chartLineWidth: clamp(model.trendStyle.chartLineWidth.value, 0.5, 12),
    showAxisLabels: model.trendStyle.showAxisLabels.value,
    axisFontSize: clamp(model.trendStyle.axisFontSize.value, 6, 30),
    axisColor: model.trendStyle.axisColor.value.value,
    selectedBorderColor: model.selectionStyle.selectedBorderColor.value.value,
    selectedBackgroundColor: model.selectionStyle.selectedBackgroundColor.value.value,
    selectedBorderWidth: clamp(model.selectionStyle.selectedBorderWidth.value, 1, 12),
    dimUnselected: model.selectionStyle.dimUnselected.value,
    unselectedOpacity: clamp(model.selectionStyle.unselectedOpacity.value, 5, 100)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value) || min));
}
