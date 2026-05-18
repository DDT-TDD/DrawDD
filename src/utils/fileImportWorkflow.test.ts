import { describe, expect, it } from '@jest/globals';

import { detectImportFormat } from './importExport';
import { fileFromElectronOpenResult, getRecentImportFileType, stripImportedFileName } from './fileImportWorkflow';

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

describe('import format detection', () => {
  it('detects KityMinder JSON even when the extension is .json', () => {
    const kmJson = JSON.stringify({
      root: {
        data: { text: 'Root Topic' },
        children: [],
      },
      theme: 'fresh-blue',
    });

    expect(detectImportFormat('mindmap.json', kmJson)).toBe('kityminder');
  });

  it('detects DRAWDD JSON documents separately from KityMinder JSON', () => {
    const drawddJson = JSON.stringify({
      version: '2.2.1',
      type: 'flowchart',
      nodes: [],
      edges: [],
    });

    expect(detectImportFormat('diagram.json', drawddJson)).toBe('drawdd');
  });

  it('sniffs FreePlane and draw.io XML content by structure, not only extension', () => {
    const freePlaneXml = '<map><node TEXT="Root"><richcontent TYPE="NODE"><html><body><p>Rich</p></body></html></richcontent></node></map>';
    const drawioXml = '<mxfile host="app.diagrams.net"><diagram id="a">&lt;mxGraphModel /&gt;</diagram></mxfile>';

    expect(detectImportFormat('mindmap.xml', freePlaneXml)).toBe('freeplane');
    expect(detectImportFormat('diagram.xml', drawioXml)).toBe('drawio');
  });
});

describe('electron file import helpers', () => {
  it('reconstructs binary files from base64 payloads', async () => {
    const original = new Uint8Array([80, 75, 3, 4]);
    const base64 = btoa(String.fromCharCode(...original));
    const file = fileFromElectronOpenResult({
      success: true,
      fileName: 'test.xmind',
      contentBase64: base64,
    });

    expect(file.name).toBe('test.xmind');
    expect(new Uint8Array(await readFileAsArrayBuffer(file))).toEqual(original);
  });

  it('normalizes imported file names and recent-file types', () => {
    expect(stripImportedFileName('diagram.drawdd.json')).toBe('diagram');
    expect(stripImportedFileName('mindmap.km')).toBe('mindmap');
    expect(getRecentImportFileType('diagram.drwdd')).toBe('json');
    expect(getRecentImportFileType('mindmap.json')).toBe('json');
    expect(getRecentImportFileType('diagram.xml')).toBe('xml');
  });
});