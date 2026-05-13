import type { Graph } from '@antv/x6';

import type { ColorScheme, NodeData, ShapeBodyAttrs } from '../types';
import {
  getVennThemeStyle,
  getVennVariantIndex,
  isTransparentBody,
  isVennSetNodeData,
  snapshotVisibleBodyStyle,
} from './venn';

type MutableNodeData = Partial<NodeData> & Record<string, unknown>;

export function applyColorSchemeToGraph(graph: Graph, scheme: ColorScheme): void {
  let colorIndex = 0;
  let fallbackVennIndex = 0;

  graph.getNodes().forEach((node) => {
    const attrs = node.getAttrs();
    const body = (attrs.body || {}) as Partial<ShapeBodyAttrs>;
    const nodeData = (node.getData() || {}) as MutableNodeData;

    // Transparent labels and annotations keep their own appearance.
    if (isTransparentBody(body)) {
      return;
    }

    if (isVennSetNodeData(nodeData, body)) {
      const vennVariantIndex = getVennVariantIndex(nodeData, attrs.label?.text, fallbackVennIndex++);
      const themedVennStyle = getVennThemeStyle(
        scheme,
        vennVariantIndex,
        typeof body.fillOpacity === 'number' ? body.fillOpacity : 0.30,
      );
      const nextBody = {
        ...body,
        fill: themedVennStyle.fill,
        stroke: themedVennStyle.stroke,
        fillOpacity: themedVennStyle.fillOpacity,
      };

      node.setAttrs({
        body: nextBody,
        label: { fill: themedVennStyle.labelFill },
      });
      node.setData({
        ...nodeData,
        isVenn: true,
        isVennSet: true,
        isVennLabel: false,
        vennVariantIndex,
        lastVisibleBodyStyle: snapshotVisibleBodyStyle(nextBody),
      });
      return;
    }

    const colorType = colorIndex % 3 === 0 ? 'primary' : colorIndex % 3 === 1 ? 'secondary' : 'accent';
    colorIndex += 1;
    const colors = scheme.nodeColors[colorType];
    const nextBody = {
      ...body,
      fill: colors.fill,
      stroke: colors.stroke,
    };

    node.setAttrs({
      body: nextBody,
      label: { fill: colors.text },
    });
    node.setData({
      ...nodeData,
      lastVisibleBodyStyle: snapshotVisibleBodyStyle(nextBody),
    });
  });

  graph.getEdges().forEach((edge) => {
    edge.setAttrs({
      line: { stroke: scheme.lineColor },
    });
  });
}