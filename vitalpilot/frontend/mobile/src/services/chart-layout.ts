// Gifted Charts adds axis width and its own content padding. Compute from the
// measured card content, not the device width, so the final day stays visible.
export function chartLayout(
  containerWidth: number,
  count: number,
  habit: boolean,
) {
  const axisWidth = 44;
  const width = Math.max(100, containerWidth - axisWidth - 12);
  const padding = 14;
  const visible = Math.max(1, Math.min(7, count));
  if (habit) {
    const gap = 8;
    const barWidth = Math.max(
      4,
      (width - padding * 2 - gap * (visible - 1)) / visible,
    );
    return {
      width,
      axisWidth,
      initialSpacing: padding,
      endSpacing: padding,
      spacing: gap,
      barWidth,
      step: barWidth + gap,
    };
  }
  const step = (width - padding * 2) / Math.max(1, visible - 1);
  return {
    width,
    axisWidth,
    initialSpacing: padding,
    endSpacing: padding,
    spacing: step,
    barWidth: 0,
    step,
  };
}

export function chartScrollOffset(
  index: number,
  layout: ReturnType<typeof chartLayout>,
) {
  return Math.max(
    0,
    layout.initialSpacing +
      index * layout.step +
      layout.barWidth / 2 -
      layout.width / 2,
  );
}

export function latestChartIndex(series: { value: number | undefined }[]) {
  for (let index = series.length - 1; index >= 0; index--)
    if (series[index].value != null) return index;
  return -1;
}
