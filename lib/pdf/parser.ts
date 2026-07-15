import { PDFParse } from "pdf-parse";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";

// Point to the real worker file in node_modules.
// This works because pdfjs-dist is in serverExternalPackages (not bundled),
// so Node.js can resolve the path directly.
pdfjs.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
);

export interface ParsedPdf {
  text: string;
  numPages: number;
  info: Record<string, unknown>;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    cMapUrl: "./node_modules/pdfjs-dist/cmaps/",
    cMapPacked: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const textParts: string[] = [];

  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let lastY: number | undefined;
    let pageText = "";

    for (const item of textContent.items) {
      const textItem = item as { str: string; transform: number[] };
      const str = textItem.str;
      const y = textItem.transform[5];

      if (lastY !== undefined && Math.abs(y - lastY) > 0.5) {
        pageText += "\n";
      } else if (lastY !== undefined && !pageText.endsWith(" ") && !str.startsWith(" ")) {
        pageText += " ";
      }

      pageText += str;
      lastY = y;
    }

    textParts.push(pageText);
    page.cleanup();
  }

  return {
    text: textParts.join("\n\n"),
    numPages,
    info: {},
  };
}

export async function parsePdfWithPdfParse(buffer: Buffer): Promise<ParsedPdf> {
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    return {
      text: textResult.text ?? "",
      numPages: infoResult.total ?? 0,
      info: (infoResult.info ?? {}) as Record<string, unknown>,
    };
  } finally {
    await parser.destroy();
  }
}
