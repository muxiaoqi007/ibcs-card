import { CardSettings, KpiCard, TrendPoint } from "./model";

const SVG_NS = "http://www.w3.org/2000/svg";

function selectionKey(selectionId: unknown): string | undefined {
  if (!selectionId) return undefined;
  const candidate = selectionId as { getKey?: () => string };
  try {
    return typeof candidate.getKey === "function" ? candidate.getKey() : undefined;
  } catch {
    return undefined;
  }
}

function selectionMatches(active: unknown, candidate: unknown): boolean {
  const activeKey = selectionKey(active);
  const candidateKey = selectionKey(candidate);
  if (activeKey != null && activeKey === candidateKey) return true;
  const left = active as { includes?: (other: unknown, ignoreHighlight?: boolean) => boolean } | undefined;
  const right = candidate as { includes?: (other: unknown, ignoreHighlight?: boolean) => boolean } | undefined;
  try {
    if (typeof left?.includes === "function" && left.includes(candidate, true)) return true;
    if (typeof right?.includes === "function" && right.includes(active, true)) return true;
  } catch {
    return false;
  }
  return false;
}

type RendererCallbacks = {
  onSelect?: (card: KpiCard, multi: boolean, isSelected: boolean) => void;
  onClearSelection?: () => void;
  onContextMenu?: (card: KpiCard, point: TrendPoint | undefined, x: number, y: number) => void;
};

export class CardsRenderer {
  private order: string[] = [];
  private focusedKey: string | null = null;
  private layoutOverride: "grid" | "row" | null = null;
  private root: HTMLElement;
  private sourceCards: KpiCard[] = [];
  private cards: KpiCard[] = [];
  private selectedKeys = new Set<string>();
  private settings!: CardSettings;

  constructor(root: HTMLElement, private callbacks: RendererCallbacks = {}) {
    this.root = root;
    this.root.classList.add("ibcs-visual");
  }

  public syncSelection(selectionIds: unknown[]): void {
    this.selectedKeys = new Set(
      this.cards
        .filter(card => {
          const cardIds = card.selectionIds?.length ? card.selectionIds : [card.selectionId];
          return cardIds.some(cardId => cardId != null && selectionIds.some(activeId => selectionMatches(activeId, cardId)));
        })
        .map(card => card.key)
    );
    if (this.settings) this.render(this.sourceCards, this.settings);
  }

  render(cards: KpiCard[], settings: CardSettings): void {
    this.sourceCards = cards;
    this.cards = applyTopN(this.sortCards(cards, settings.sortMode), settings);
    const availableKeys = new Set(this.cards.map(card => card.key));
    for (const key of this.selectedKeys) {
      if (!availableKeys.has(key)) this.selectedKeys.delete(key);
    }
    this.settings = { ...settings, layout: this.layoutOverride ?? settings.layout };
    this.root.style.setProperty("--good", this.settings.goodColor);
    this.root.style.setProperty("--bad", this.settings.badColor);
    this.root.style.setProperty("--actual", this.settings.actualColor);
    this.root.style.setProperty("--comparison", this.settings.comparisonColor);
    this.root.style.setProperty("--forecast", this.settings.forecastColor);
    this.root.style.setProperty("--neutral", this.settings.neutralColor);
    this.root.style.setProperty("--gap", `${this.settings.spacing}px`);
    this.root.style.setProperty("--card-bg", this.settings.cardBackgroundColor);
    this.root.style.setProperty("--card-border", this.settings.cardBorderColor);
    this.root.style.setProperty("--card-border-width", `${this.settings.cardBorderWidth}px`);
    this.root.style.setProperty("--card-radius", `${this.settings.cardCornerRadius}px`);
    this.root.style.setProperty("--title-size", `${this.settings.titleFontSize}px`);
    this.root.style.setProperty("--title-color", this.settings.titleColor);
    this.root.style.setProperty("--title-weight", this.settings.titleBold ? "700" : "400");
    this.root.style.setProperty("--value-size", `${this.settings.valueFontSize}px`);
    this.root.style.setProperty("--value-color", this.settings.valueColor);
    this.root.style.setProperty("--value-weight", this.settings.valueBold ? "700" : "400");
    this.root.style.setProperty("--variance-size", `${this.settings.varianceFontSize}px`);
    this.root.style.setProperty("--variance-label", this.settings.varianceLabelColor);
    this.root.style.setProperty("--comment-color", this.settings.commentColor);
    this.root.style.setProperty("--chart-height", `${this.settings.chartHeight}px`);
    this.root.style.setProperty("--selected-border", this.settings.selectedBorderColor);
    this.root.style.setProperty("--selected-bg", this.settings.selectedBackgroundColor);
    this.root.style.setProperty("--selected-width", `${this.settings.selectedBorderWidth}px`);
    this.root.style.setProperty("--unselected-opacity", String(this.settings.unselectedOpacity / 100));
    this.root.style.fontFamily = this.settings.fontFamily;
    this.root.replaceChildren();

    if (!cards.length) {
      this.renderLanding();
      return;
    }

    if (this.settings.showToolbar) this.root.append(this.createToolbar());
    const container = document.createElement("div");
    container.className = `cards-container layout-${this.settings.layout}`;
    container.style.setProperty("--columns", String(Math.max(1, Math.min(8, this.settings.maxCardsInRow))));
    container.onclick = event => {
      if (event.target !== container || this.selectedKeys.size === 0) return;
      this.selectedKeys.clear();
      this.callbacks.onClearSelection?.();
      this.render(this.sourceCards, this.settings);
    };

    const extents = this.getChartExtents(this.cards);
    const maxRelativeVariance = this.getMaxRelativeVariance(this.cards);
    for (const card of this.cards) container.append(this.createCard(card, extents.get(card.key) ?? null, false, maxRelativeVariance));
    this.root.append(container);

    if (this.focusedKey) {
      const focused = this.cards.find(card => card.key === this.focusedKey);
      if (focused) this.root.append(this.createFocus(focused, extents.get(focused.key) ?? null, maxRelativeVariance));
    }
  }

  private sortCards(cards: KpiCard[], mode: CardSettings["sortMode"]): KpiCard[] {
    const available = new Set(cards.map(card => card.key));
    this.order = this.order.filter(key => available.has(key));
    const known = new Set(this.order);
    for (const card of cards) {
      if (!known.has(card.key)) {
        this.order.push(card.key);
        known.add(card.key);
      }
    }

    const originalRank = new Map(this.order.map((key, index) => [key, index]));
    const stable = (a: KpiCard, b: KpiCard) => (originalRank.get(a.key) ?? 9999) - (originalRank.get(b.key) ?? 9999);
    const compareNumber = (a: number | null, b: number | null, descending: boolean): number => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return descending ? b - a : a - b;
    };
    const variance = (card: KpiCard): number | null => {
      const reference = card.plan ?? card.previous;
      if (card.value == null || reference == null) return null;
      return reference === 0 ? card.value - reference : (card.value - reference) / Math.abs(reference);
    };

    return [...cards].sort((a, b) => {
      let result = 0;
      if (mode === "valueDesc") result = compareNumber(a.value, b.value, true);
      else if (mode === "valueAsc") result = compareNumber(a.value, b.value, false);
      else if (mode === "varianceDesc") result = compareNumber(variance(a), variance(b), true);
      else if (mode === "varianceAsc") result = compareNumber(variance(a), variance(b), false);
      else if (mode === "titleAsc") result = a.title.localeCompare(b.title, "zh-CN", { numeric: true });
      else if (mode === "titleDesc") result = b.title.localeCompare(a.title, "zh-CN", { numeric: true });
      return result || stable(a, b);
    });
  }

  private renderLanding(): void {
    const landing = document.createElement("div");
    landing.className = "landing";
    const mark = document.createElement("div");
    mark.className = "landing-mark";
    mark.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    const heading = document.createElement("h2");
    heading.textContent = "IBCS Card";
    const description = document.createElement("p");
    description.append("请添加", strong("实际值"), "和", strong("指标分组"), "字段以生成响应式指标卡。" );
    const hint = document.createElement("small");
    hint.textContent = "可选字段：趋势类别、去年同期、计划、预测和备注";
    landing.append(mark, heading, description, hint);
    this.root.append(landing);
  }

  private createToolbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "visual-toolbar";
    bar.setAttribute("aria-label", "卡片布局工具栏");
    const handle = document.createElement("span");
    handle.className = "toolbar-handle";
    handle.textContent = "⌄";
    const panel = document.createElement("div");
    panel.className = "toolbar-panel";
    const gridButton = toolbarButton("▦", "卡片布局");
    gridButton.dataset.layout = "grid";
    const rowButton = toolbarButton("☷", "行布局");
    rowButton.dataset.layout = "row";
    const divider = document.createElement("span");
    divider.className = "toolbar-divider";
    const syncButton = toolbarButton("↕", "统一趋势图刻度");
    syncButton.dataset.scale = "toggle";
    panel.append(gridButton, rowButton, divider, syncButton);
    bar.append(handle, panel);
    bar.querySelectorAll<HTMLButtonElement>("[data-layout]").forEach(button => {
      button.classList.toggle("active", button.dataset.layout === this.settings.layout);
      button.onclick = () => {
        this.layoutOverride = button.dataset.layout as "grid" | "row";
        this.render(this.sourceCards, this.settings);
      };
    });
    const scaleButton = bar.querySelector<HTMLButtonElement>("[data-scale]")!;
    scaleButton.classList.toggle("active", this.settings.scaleCharts);
    scaleButton.onclick = () => this.render(this.sourceCards, { ...this.settings, scaleCharts: !this.settings.scaleCharts });
    return bar;
  }

  private createCard(card: KpiCard, extent: [number, number] | null, focused: boolean, maxRelativeVariance: number): HTMLElement {
    const article = document.createElement("article");
    const isSelected = this.selectedKeys.has(card.key);
    const isDimmed = this.settings.dimUnselected && this.selectedKeys.size > 0 && !isSelected;
    const isHighlighted = card.hasHighlights && card.highlightedValue != null;
    const isHighlightDimmed = card.hasHighlights && !isHighlighted;
    article.className = `kpi-card style-${this.settings.cardStyle} align-${this.settings.valueAlignment} variance-${this.settings.variancePosition} title-position-${this.settings.titlePosition} title-align-${this.settings.titleAlignment}${focused ? " is-focused" : ""}${isSelected ? " is-selected" : ""}${isDimmed ? " is-dimmed" : ""}${isHighlighted ? " is-highlighted" : ""}${isHighlightDimmed ? " is-highlight-dimmed" : ""}`;
    article.draggable = !focused && this.settings.sortMode === "original";
    article.dataset.key = card.key;
    article.tabIndex = 0;
    article.setAttribute("aria-label", `${card.title}: ${this.formatCardValue(card.value, card.format)}`);

    const header = document.createElement("header");
    const title = document.createElement("div");
    title.className = `card-title${this.settings.wrapTitle ? " wrap" : ""}`;
    title.textContent = card.title;
    title.title = card.title;
    title.hidden = !this.settings.showTitle || this.settings.titlePosition !== "top";
    const actions = document.createElement("div");
    actions.className = "card-actions";
    if (card.comment) {
      const commentButton = actionButton("●", "备注", "comment-button");
      commentButton.title = card.comment;
      actions.append(commentButton);
    }
    actions.append(actionButton("↗", "聚焦卡片", "focus-button"), actionButton("•••", "更多选项", "more-button"));
    header.append(title, actions);
    article.append(header);

    const metrics = document.createElement("div");
    metrics.className = "metrics";
    const primary = document.createElement("div");
    primary.className = "primary-metric";
    const headline = document.createElement("div");
    headline.className = "headline";
    headline.textContent = this.formatCardValue(card.value, card.format);
    headline.hidden = !this.settings.showValue;
    if (this.settings.showTitle && this.settings.titlePosition === "above") primary.append(this.cloneVisibleTitle(title));
    primary.append(headline);
    if (this.settings.showTitle && this.settings.titlePosition === "below") primary.append(this.cloneVisibleTitle(title));
    if (this.settings.showValue || (this.settings.showTitle && this.settings.titlePosition !== "top")) metrics.append(primary);
    if (card.hasHighlights && card.highlightedValue != null && card.highlightedValue !== card.value) {
      const highlighted = document.createElement("div");
      highlighted.className = "highlight-value";
      highlighted.textContent = this.formatCardValue(card.highlightedValue, card.format);
      highlighted.title = "当前联动高亮值";
      metrics.append(highlighted);
    }

    const reference = card.plan ?? card.previous;
    if (this.settings.showVariance !== "none" && reference != null && card.value != null) {
      metrics.append(this.createVariance(card.value, reference, card.plan != null ? "PL" : "PY", card.format, false, maxRelativeVariance));
    }
    if (this.settings.showVariance !== "none" && card.plan != null && card.previous != null && card.value != null) {
      metrics.append(this.createVariance(card.value, card.previous, "PY", card.format, true, maxRelativeVariance));
    }
    article.append(metrics);

    if (card.secondary.length) {
      const secondary = document.createElement("div");
      secondary.className = "secondary-values";
      card.secondary.forEach(item => {
        const node = document.createElement("span");
        node.append(strong(item.label), ` ${this.formatCardValue(item.value, item.format)}`);
        secondary.append(node);
      });
      article.append(secondary);
    }

    if (!this.settings.suppressChart && card.points.length > 1) {
      const chart = createChart(card, this.settings, extent, point => {
        const rect = chart.getBoundingClientRect();
        this.callbacks.onContextMenu?.(card, point, rect.left, rect.bottom);
      });
      chart.classList.add("microchart");
      article.append(chart);
    } else {
      article.classList.add("no-chart");
    }

    article.onclick = event => {
      if ((event.target as HTMLElement).closest("button")) return;
      const multi = event.ctrlKey || event.metaKey;
      this.callbacks.onSelect?.(card, multi, isSelected);
    };
    article.oncontextmenu = event => {
      event.preventDefault();
      this.callbacks.onContextMenu?.(card, undefined, event.clientX, event.clientY);
    };
    article.querySelector<HTMLButtonElement>(".focus-button")!.onclick = event => {
      event.stopPropagation();
      this.focusedKey = card.key;
      this.render(this.sourceCards, this.settings);
    };
    article.querySelector<HTMLButtonElement>(".more-button")!.onclick = event => {
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.callbacks.onContextMenu?.(card, undefined, rect.left, rect.bottom);
    };
    this.attachDrag(article);
    return article;
  }

  private createVariance(actual: number, comparison: number, label: string, format?: string, compact = false, maxRelativeVariance = 0): HTMLElement {
    const absolute = actual - comparison;
    const visualState = getVarianceVisualState(actual, comparison, this.settings, maxRelativeVariance);
    const relative = visualState.relative;
    const node = document.createElement("div");
    node.className = `variance ${visualState.state}${compact ? " compact" : ""}`;
    const absText = `${absolute >= 0 ? "+" : ""}${formatValue(absolute, format, this.settings.displayUnits, this.settings.decimalPlaces, true)}`;
    const relText = relative == null ? "–" : `${relative >= 0 ? "+" : ""}${(relative * 100).toFixed(Math.abs(relative) < 0.1 ? 1 : 0)}%`;
    const icon = document.createElement("span");
    icon.className = "variance-icon";
    icon.textContent = visualState.state === "neutral" ? "•" : visualState.state === "positive" ? "↑" : "↓";
    icon.style.setProperty("--variance-icon-scale", visualState.scale.toFixed(3));
    const value = document.createElement("span");
    if (this.settings.showVariance === "absolute") value.textContent = absText;
    else if (this.settings.showVariance === "relative") value.textContent = relText;
    else {
      const separator = document.createElement("span");
      separator.className = "variance-separator";
      separator.textContent = "|";
      value.append(relText, separator, absText);
    }
    const comparisonLabel = document.createElement("em");
    comparisonLabel.textContent = `Δ${label}`;
    node.append(icon, value, comparisonLabel);
    return node;
  }

  private formatCardValue(value: number | null, format?: string): string {
    return formatValue(value, format, this.settings.displayUnits, this.settings.decimalPlaces);
  }

  private cloneVisibleTitle(title: HTMLElement): HTMLElement {
    const clone = title.cloneNode(true) as HTMLElement;
    clone.hidden = false;
    return clone;
  }

  private createFocus(card: KpiCard, extent: [number, number] | null, maxRelativeVariance: number): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "focus-overlay";
    const panel = document.createElement("section");
    panel.className = "focus-panel";
    const close = document.createElement("button");
    close.className = "focus-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "关闭聚焦模式");
    close.onclick = () => {
      this.focusedKey = null;
      this.render(this.sourceCards, this.settings);
    };
    panel.append(close, this.createCard(card, extent, true, maxRelativeVariance));
    if (card.comment) {
      const comment = document.createElement("aside");
      comment.className = "focus-comment";
      const paragraph = document.createElement("p");
      paragraph.textContent = card.comment;
      comment.append(strong("备注"), paragraph);
      panel.append(comment);
    }
    overlay.onclick = event => { if (event.target === overlay) close.click(); };
    overlay.append(panel);
    return overlay;
  }

  private attachDrag(cardElement: HTMLElement): void {
    cardElement.ondragstart = event => {
      event.dataTransfer?.setData("text/plain", cardElement.dataset.key ?? "");
      event.dataTransfer!.effectAllowed = "move";
      cardElement.classList.add("dragging");
    };
    cardElement.ondragend = () => cardElement.classList.remove("dragging");
    cardElement.ondragover = event => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = "move";
    };
    cardElement.ondrop = event => {
      event.preventDefault();
      const source = event.dataTransfer?.getData("text/plain");
      const target = cardElement.dataset.key;
      if (!source || !target || source === target) return;
      const from = this.order.indexOf(source);
      const to = this.order.indexOf(target);
      this.order.splice(from, 1);
      this.order.splice(to, 0, source);
      this.render(this.sourceCards, this.settings);
    };
  }

  private getGlobalExtent(cards: KpiCard[]): [number, number] | null {
    const values = this.settings.chartType === "bullet"
      ? cards.flatMap(card => [0, card.value, card.previous, card.plan, card.forecast].filter(isNumber))
      : cards.flatMap(card => card.points.flatMap(point => [point.actual, point.previous, point.plan, point.forecast]).filter(isNumber));
    return values.length ? [Math.min(...values), Math.max(...values)] : null;
  }

  private getChartExtents(cards: KpiCard[]): Map<string, [number, number] | null> {
    const result = new Map<string, [number, number] | null>();
    if (this.settings.scaleMode === "all") {
      const extent = this.getGlobalExtent(cards);
      cards.forEach(card => result.set(card.key, extent));
      return result;
    }
    if (this.settings.scaleMode === "group") {
      const groups = new Map<string, KpiCard[]>();
      cards.forEach(card => {
        const groupKey = card.scaleGroup ?? card.title;
        const members = groups.get(groupKey) ?? [];
        members.push(card);
        groups.set(groupKey, members);
      });
      groups.forEach(members => {
        const extent = this.getGlobalExtent(members);
        members.forEach(card => result.set(card.key, extent));
      });
      return result;
    }
    cards.forEach(card => result.set(card.key, null));
    return result;
  }

  private getMaxRelativeVariance(cards: KpiCard[]): number {
    return Math.max(0, ...cards.map(card => {
      const reference = card.plan ?? card.previous;
      if (card.value == null || reference == null || reference === 0) return 0;
      return Math.abs((card.value - reference) / Math.abs(reference));
    }));
  }
}

function createChart(card: KpiCard, settings: CardSettings, extent: [number, number] | null, onPointContextMenu?: (point: TrendPoint) => void): SVGSVGElement {
  const points = card.points;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 320 120");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "趋势图");
  const bulletValues = getBulletValues(card);
  const values = settings.chartType === "bullet"
    ? [0, bulletValues.actual, bulletValues.previous, bulletValues.plan, bulletValues.forecast].filter(isNumber)
    : points.flatMap(point => [point.actual, point.previous, point.plan, point.forecast]).filter(isNumber);
  if (!values.length) return svg;
  let min = extent?.[0] ?? Math.min(...values);
  let max = extent?.[1] ?? Math.max(...values);
  const axisBreak = getAxisBreak(min, max, settings);
  if (axisBreak) min = axisBreak.min;
  if (max === min) { max += 1; min -= 1; }
  const pad = (max - min) * 0.08;
  min -= pad;
  max += pad;
  const x = (index: number) => 10 + index * (300 / Math.max(1, points.length - 1));
  const y = (value: number) => 98 - ((value - min) / (max - min)) * 82;

  if (settings.chartType === "bullet") {
    drawBullet(svg, bulletValues, settings, extent);
  } else if (settings.chartType === "waterfall") {
    drawWaterfall(svg, points, x, y, settings);
  } else if (settings.chartType === "variance") {
    drawVariance(svg, points, x, y, settings);
  } else {
    const comparisonKey = getTrendComparisonKey(points);
    const comparisonPath = comparisonKey ? linePath(points, comparisonKey, x, y) : "";
    if (comparisonPath) svg.append(svgPath(comparisonPath, settings.comparisonColor, "none", Math.max(1, settings.chartLineWidth * 0.75)));
    const actualPath = linePath(points, "actual", x, y);
    const forecastPath = linePath(points, "forecast", x, y);
    if (forecastPath) {
      const path = svgPath(forecastPath, settings.forecastColor, "none", settings.chartLineWidth);
      path.setAttribute("stroke-dasharray", "6 4");
      path.setAttribute("class", "forecast-line");
      svg.append(path);
    }
    if (settings.chartType === "area" && actualPath) {
      const lastX = x(points.length - 1);
      const baseY = Math.min(110, Math.max(8, y(0)));
      const area = `${actualPath} L ${lastX} ${baseY} L ${x(0)} ${baseY} Z`;
      const diff = (lastNumber(points, "actual") ?? 0) - (lastNumber(points, "plan") ?? lastNumber(points, "previous") ?? 0);
      const good = (settings.invertNegative ? -diff : diff) >= 0;
      svg.append(svgPath(area, "none", good ? settings.goodColor : settings.badColor, 0, 0.86));
    }
    if (actualPath) svg.append(svgPath(actualPath, settings.actualColor, "none", settings.chartLineWidth));
    const highlightPath = linePath(points, "actualHighlight", x, y);
    if (highlightPath) svg.append(svgPath(highlightPath, settings.actualColor, "none", Math.max(settings.chartLineWidth + 1.5, 3.5), 1, "trend-highlight"));
    if (settings.chartType === "line") {
      points.forEach((point, index) => {
        if (point.actual == null) return;
        const comparison = point.plan ?? point.previous;
        const diff = comparison == null ? 0 : point.actual - comparison;
        const good = (settings.invertNegative ? -diff : diff) >= 0;
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", String(x(index)));
        dot.setAttribute("cy", String(y(point.actual)));
        dot.setAttribute("r", index === points.length - 1 ? "4" : "2.5");
        dot.setAttribute("fill", good ? settings.goodColor : settings.badColor);
        svg.append(dot);
      });
    }
  }
  points.forEach((point, index) => {
    if (!point.selectionId || point.actual == null) return;
    const hit = document.createElementNS(SVG_NS, "circle");
    hit.setAttribute("cx", String(x(index)));
    hit.setAttribute("cy", String(y(point.actual)));
    hit.setAttribute("r", "8");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("class", "trend-hit-target");
    hit.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();
      onPointContextMenu?.(point);
    });
    svg.append(hit);
  });
  if (settings.showAxisLabels) addAxisLabels(svg, points, settings);
  if (axisBreak) addAxisBreakMark(svg, settings);
  return svg;
}

function addAxisBreakMark(svg: SVGSVGElement, settings: CardSettings): void {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M 6 91 L 11 86 L 16 91 L 21 86");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", settings.axisColor);
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("class", "axis-break-mark");
  svg.append(path);
}

export function getAxisBreak(min: number, max: number, settings: Pick<CardSettings, "autoAxisBreak" | "axisBreakThresholdPercent">): { min: number } | null {
  if (!settings.autoAxisBreak || min <= 0 || max <= 0 || max <= min) return null;
  const spreadPercent = ((max - min) / max) * 100;
  if (spreadPercent > settings.axisBreakThresholdPercent) return null;
  return { min: Math.max(0, min - (max - min) * .12) };
}

function drawWaterfall(svg: SVGSVGElement, points: TrendPoint[], x: (i: number) => number, y: (v: number) => number, settings: CardSettings): void {
  const actuals = points.map(point => point.actual).filter(isNumber);
  const barWidth = Math.max(5, Math.min(24, 240 / Math.max(1, actuals.length)));
  actuals.forEach((value, index) => {
    const previous = index ? actuals[index - 1] : 0;
    const top = Math.min(y(value), y(previous));
    const height = Math.max(2, Math.abs(y(value) - y(previous)));
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(x(index) - barWidth / 2));
    rect.setAttribute("y", String(top));
    rect.setAttribute("width", String(barWidth));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", value - previous >= 0 ? settings.goodColor : settings.badColor);
    svg.append(rect);
    if (index < actuals.length - 1) {
      const connector = document.createElementNS(SVG_NS, "line");
      connector.setAttribute("x1", String(x(index) + barWidth / 2));
      connector.setAttribute("x2", String(x(index + 1) - barWidth / 2));
      connector.setAttribute("y1", String(y(value)));
      connector.setAttribute("y2", String(y(value)));
      connector.setAttribute("stroke", settings.comparisonColor);
      connector.setAttribute("stroke-dasharray", "2 2");
      svg.append(connector);
    }
  });
}

function drawVariance(svg: SVGSVGElement, points: TrendPoint[], x: (i: number) => number, y: (v: number) => number, settings: CardSettings): void {
  const baseline = Math.min(108, Math.max(10, y(0)));
  points.forEach((point, index) => {
    if (point.actual == null) return;
    const compare = point.plan ?? point.previous ?? 0;
    const diff = point.actual - compare;
    const good = (settings.invertNegative ? -diff : diff) >= 0;
    const width = Math.max(5, 240 / Math.max(1, points.length) - 4);
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(x(index) - width / 2));
    rect.setAttribute("y", String(Math.min(y(diff), baseline)));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(Math.max(2, Math.abs(y(diff) - baseline))));
    rect.setAttribute("fill", good ? settings.goodColor : settings.badColor);
    svg.append(rect);
  });
}

function linePath(points: TrendPoint[], key: "actual" | "previous" | "plan" | "forecast" | "actualHighlight", x: (i: number) => number, y: (v: number) => number): string {
  let path = "";
  points.forEach((point, index) => {
    const value = point[key];
    if (value == null) return;
    path += `${path ? " L" : "M"} ${x(index)} ${y(value)}`;
  });
  return path;
}

function drawBullet(svg: SVGSVGElement, bulletValues: BulletValues, settings: CardSettings, extent: [number, number] | null): void {
  const { actual, plan, previous, forecast } = bulletValues;
  const numericValues = [actual, plan, previous, forecast, 0].filter(isNumber);
  if (!numericValues.length || actual == null) return;
  const max = Math.max(...numericValues, extent?.[1] ?? 0, 0);
  const min = Math.min(...numericValues, extent?.[0] ?? 0, 0);
  const range = max - min || 1;
  const x = (value: number) => 12 + ((value - min) / range) * 296;
  const zero = x(0);
  const end = x(actual);

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", "12");
  background.setAttribute("y", "43");
  background.setAttribute("width", "296");
  background.setAttribute("height", "34");
  background.setAttribute("fill", "#eeeeee");
  svg.append(background);

  const bar = document.createElementNS(SVG_NS, "rect");
  bar.setAttribute("x", String(Math.min(zero, end)));
  bar.setAttribute("y", "50");
  bar.setAttribute("width", String(Math.max(2, Math.abs(end - zero))));
  bar.setAttribute("height", "20");
  bar.setAttribute("fill", settings.actualColor);
  svg.append(bar);

  const marker = (value: number | null, color: string, dash = "") => {
    if (value == null) return;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(x(value)));
    line.setAttribute("x2", String(x(value)));
    line.setAttribute("y1", "37");
    line.setAttribute("y2", "83");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "3");
    if (dash) line.setAttribute("stroke-dasharray", dash);
    svg.append(line);
  };
  marker(plan, settings.comparisonColor);
  marker(previous, settings.comparisonColor, "2 2");
  marker(forecast, settings.forecastColor, "6 3");
}

type BulletValues = { actual: number | null; plan: number | null; previous: number | null; forecast: number | null };

export function getBulletValues(source: TrendPoint[] | Pick<KpiCard, "value" | "plan" | "previous" | "forecast">): BulletValues {
  if (!Array.isArray(source)) {
    return { actual: source.value, plan: source.plan, previous: source.previous, forecast: source.forecast };
  }
  const actualPoint = [...source].reverse().find(point => point.actual != null);
  return {
    actual: actualPoint?.actual ?? null,
    plan: actualPoint?.plan ?? null,
    previous: actualPoint?.previous ?? null,
    forecast: lastNumber(source, "forecast")
  };
}

export function getVarianceVisualState(actual: number, comparison: number, settings: Pick<CardSettings, "invertNegative" | "neutralTolerancePercent" | "scaleVarianceIcons">, maxRelativeVariance: number): { relative: number | null; state: "positive" | "negative" | "neutral"; scale: number } {
  const absolute = actual - comparison;
  const relative = comparison === 0 ? null : absolute / Math.abs(comparison);
  const semantic = (settings.invertNegative ? -1 : 1) * absolute;
  const neutral = relative != null && Math.abs(relative) <= settings.neutralTolerancePercent / 100;
  const state = neutral ? "neutral" : semantic >= 0 ? "positive" : "negative";
  const scale = settings.scaleVarianceIcons && relative != null && maxRelativeVariance > 0
    ? 0.65 + 0.75 * Math.sqrt(Math.min(1, Math.abs(relative) / maxRelativeVariance))
    : 1;
  return { relative, state, scale };
}

export function getTrendComparisonKey(points: TrendPoint[]): "plan" | null {
  return points.some(point => point.plan != null) ? "plan" : null;
}

function svgPath(d: string, stroke: string, fill: string, width: number, opacity = 1, className?: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", stroke);
  path.setAttribute("fill", fill);
  path.setAttribute("stroke-width", String(width));
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.setAttribute("opacity", String(opacity));
  if (className) path.setAttribute("class", className);
  return path;
}

function addAxisLabels(svg: SVGSVGElement, points: TrendPoint[], settings: CardSettings): void {
  [0, points.length - 1].forEach(index => {
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", index === 0 ? "7" : "313");
    label.setAttribute("y", "116");
    label.setAttribute("text-anchor", index === 0 ? "start" : "end");
    label.setAttribute("font-size", String(settings.axisFontSize));
    label.setAttribute("fill", settings.axisColor);
    label.textContent = points[index]?.category ?? "";
    svg.append(label);
  });
}

function lastNumber(points: TrendPoint[], key: keyof TrendPoint): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const value = points[i][key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function formatValue(value: number | null, format = "", displayUnits: CardSettings["displayUnits"] = "auto", decimalPlaces = -1, forceCompact = false): string {
  if (value == null || !Number.isFinite(value)) return "–";
  const currency = format.includes("€") ? "€" : format.includes("£") ? "£" : format.includes("¥") || format.includes("￥") ? "¥" : format.includes("$") ? "$" : "";
  if (format.includes("%") && Math.abs(value) <= 10) {
    const percent = value * 100;
    const digits = decimalPlaces >= 0 ? decimalPlaces : Math.abs(value) < 0.1 ? 1 : 0;
    return `${percent.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  }
  const abs = Math.abs(value);
  const fixedUnits: Record<Exclude<CardSettings["displayUnits"], "auto">, [number, string]> = {
    none: [1, ""], thousands: [1e3, "K"], tenThousands: [1e4, "万"], millions: [1e6, "M"], hundredMillions: [1e8, "亿"], billions: [1e9, "B"]
  };
  const unit: [number, string] = displayUnits === "auto"
    ? (forceCompact || abs >= 1000 ? (abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""]) : [1, ""])
    : fixedUnits[displayUnits];
  const scaled = value / unit[0];
  const digits = decimalPlaces >= 0 ? decimalPlaces : Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
  return `${currency}${scaled.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces >= 0 ? digits : 0, maximumFractionDigits: digits })}${unit[1]}`;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function strong(text: string): HTMLElement {
  const element = document.createElement("strong");
  element.textContent = text;
  return element;
}

function toolbarButton(text: string, label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.title = label;
  button.setAttribute("aria-label", label);
  return button;
}

function actionButton(text: string, label: string, className: string): HTMLButtonElement {
  const button = toolbarButton(text, label);
  button.className = className;
  return button;
}

export function applyTopN(cards: KpiCard[], settings: Pick<CardSettings, "topN" | "topNBy" | "showOthers">): KpiCard[] {
  const limit = Math.floor(settings.topN);
  if (limit <= 0) return cards;
  const score = (card: KpiCard): number => {
    if (settings.topNBy === "variance") {
      const reference = card.plan ?? card.previous;
      return card.value == null || reference == null ? Number.NEGATIVE_INFINITY : Math.abs(card.value - reference);
    }
      return card.value == null ? Number.NEGATIVE_INFINITY : card.value;
  };
  const isGeneratedOthers = (card: KpiCard): boolean => card.isOthers === true;
  const isNamedOthers = (card: KpiCard): boolean => card.title.trim() === "其他";
  const existingOthers = settings.showOthers ? cards.filter(card => isGeneratedOthers(card) || isNamedOthers(card)) : [];
  const ranked = cards
    .filter(card => !isGeneratedOthers(card) && (!settings.showOthers || !isNamedOthers(card)))
    .sort((a, b) => score(b) - score(a));
  const kept = ranked.slice(0, limit);
  const suppressed = ranked.slice(limit);
  if (!settings.showOthers) return kept;
  const others = [...existingOthers, ...suppressed];
  return others.length ? [...kept, aggregateOthers(others)] : kept;
}

function aggregateOthers(cards: KpiCard[]): KpiCard {
  const sum = (key: "value" | "previous" | "plan" | "forecast" | "highlightedValue"): number | null => {
    const values = cards.map(card => card[key]).filter(isNumber);
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  const categories = new Map<string, TrendPoint>();
  for (const card of cards) {
    for (const point of card.points) {
      const existing = categories.get(point.category);
      if (!existing) {
        categories.set(point.category, { ...point, selectionId: undefined });
      } else {
        existing.actual = addNullable(existing.actual, point.actual);
        existing.previous = addNullable(existing.previous, point.previous);
        existing.plan = addNullable(existing.plan, point.plan);
        existing.forecast = addNullable(existing.forecast, point.forecast);
        existing.actualHighlight = addNullable(existing.actualHighlight ?? null, point.actualHighlight ?? null);
      }
    }
  }
  const selectionIds = cards.flatMap(card => card.selectionIds?.length ? card.selectionIds : card.selectionId ? [card.selectionId] : []);
  return {
    key: `__others__-${cards.map(card => card.key).join("|")}`,
    title: "其他",
    scaleGroup: "其他",
    value: sum("value"),
    previous: sum("previous"),
    plan: sum("plan"),
    forecast: sum("forecast"),
    highlightedValue: sum("highlightedValue"),
    hasHighlights: cards.some(card => card.hasHighlights),
    format: cards[0]?.format,
    points: [...categories.values()].sort((a, b) => String(a.sortValue ?? a.category).localeCompare(String(b.sortValue ?? b.category), undefined, { numeric: true })),
    secondary: [],
    selectionId: selectionIds[0],
    selectionIds,
    isOthers: true
  };
}

function addNullable(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}
