import "../style/visual.less";
import { CardsRenderer } from "../src/renderer";
import { DEFAULT_SETTINGS, KpiCard } from "../src/model";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const definitions = [
  ["Average Revenue per Customer", 31.48, 35.59, 34.1, "$0.00K", "Revenue growth is led by the enterprise segment."],
  ["Happiness Score", 55.2, 61.33, 58.2, "0.00", "Customer onboarding improvements lifted satisfaction."],
  ["Registration Success Rate", 42.9, 45.58, 46.2, "0.00", "October is slightly behind plan; mobile remains the main gap."],
  ["Availability", 571.2, 573.14, 572.5, "0.00", "Availability remains stable and above the prior-year baseline."],
  ["Throughput", 669.62, 753.04, 704.5, "0.00K", "Automation increased throughput in the last three periods."],
  ["Churned MRR", 28.4, 33.01, 29.8, "$0.00M", "Higher churn is unfavorable; this KPI uses inverted semantics."],
  ["Conversions to additional service", 132.4, 150.9, 142.0, "0.00", "Cross-sell conversion exceeded plan."],
  ["App Store Rating", 2.21, 2.44, 2.5, "0.00K", "Ratings recovered but remain just below target."],
  ["Automated Test Coverage", 328.0, 377.38, 350.0, "0.00", "Coverage now exceeds the quarterly goal."],
  ["Customer Lifetime Value", 3.1, 3.45, 3.3, "$0.00M", "Retention and expansion both contributed."],
  ["P4 Incidents", 26.5, 24.02, 25.1, "0.00K", "Fewer incidents are favorable."],
  ["Deployment Frequency", 14.2, 18.33, 16.8, "0.00K", "Deployment frequency continues to improve."]
] as const;

const cards: KpiCard[] = definitions.map(([title, start, end, plan, format, comment], cardIndex) => {
  const points = months.map((category, index) => {
    const progress = index / (months.length - 1);
    const wave = Math.sin(index * 1.55 + cardIndex) * Math.abs(end - start) * .16;
    const actual = start + (end - start) * progress + wave;
    return { category, actual, previous: actual * (.9 + (cardIndex % 3) * .025), plan: plan * (.88 + progress * .12), forecast: null };
  });
  points[points.length - 1].actual = end;
  return { key: title, title, value: end, previous: points.at(-1)!.previous, plan, forecast: null, format, points, secondary: [], comment };
});

const renderer = new CardsRenderer(document.querySelector("#visual")!);
renderer.render(cards, { ...DEFAULT_SETTINGS, maxCardsInRow: 4, spacing: 8 });
