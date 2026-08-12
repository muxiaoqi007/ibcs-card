import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "../src/formattingSettings";

const expected: Record<string, string[]> = {
  general: ["layout", "maxCardsInRow", "scaleCharts", "scaleMode", "valueMode", "sortMode", "topN", "topNBy", "showOthers"],
  card: ["showVariance", "chartType", "valueAlignment", "variancePosition", "suppressChart", "wrapTitle", "invertNegative", "scaleVarianceIcons", "neutralTolerancePercent"],
  style: ["cardStyle", "fontFamily", "spacing", "showToolbar", "goodColor", "badColor", "neutralColor", "actualColor", "comparisonColor", "forecastColor", "cardBackgroundColor", "cardBorderColor", "cardBorderWidth", "cardCornerRadius"],
  titleStyle: ["showTitle", "titlePosition", "titleAlignment", "titleFontSize", "titleColor", "titleBold"],
  valueStyle: ["showValue", "displayUnits", "decimalPlaces", "valueFontSize", "valueColor", "valueBold"],
  varianceStyle: ["varianceFontSize", "varianceLabelColor", "commentColor"],
  trendStyle: ["chartHeight", "chartLineWidth", "showAxisLabels", "autoAxisBreak", "axisBreakThresholdPercent", "axisFontSize", "axisColor", "showBulletPlanMarker", "showBulletPreviousMarker", "showBulletForecastMarker", "showBulletLabels", "bulletBackgroundColor", "bulletBarHeight", "bulletMarkerWidth"],
  selectionStyle: ["selectedBorderColor", "selectedBackgroundColor", "selectedBorderWidth", "dimUnselected", "unselectedOpacity"]
};

const service = new FormattingSettingsService();
const formattingModel = service.buildFormattingModel(new VisualFormattingSettingsModel());

for (const card of formattingModel.cards) {
  if (!("groups" in card)) throw new Error(`Formatting card ${card.displayName} has no groups.`);
  for (const group of card.groups) {
    for (const slice of group.slices) {
      if (!("control" in slice)) continue;
      const descriptor = slice.control.properties.descriptor;
      const allowed = expected[descriptor.objectName] ?? [];
      if (!allowed.includes(descriptor.propertyName)) {
        throw new Error(`Invalid formatting binding: ${descriptor.objectName}.${descriptor.propertyName}`);
      }
      const value = slice.control.properties.value;
      if (slice.control.type === "Dropdown" && (value == null || value === "")) {
        throw new Error(`Dropdown ${descriptor.objectName}.${descriptor.propertyName} has no selected value.`);
      }
    }
  }
}

console.log("Formatting model bindings and default values are valid.");
