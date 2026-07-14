export function sseStatus(status: string): Uint8Array {
  return new TextEncoder().encode(`event: status\ndata: ${status}\n\n`);
}

export function sseContent(text: string): Uint8Array {
  return new TextEncoder().encode(`event: content\ndata: ${JSON.stringify(text)}\n\n`);
}

export function createSingleMessageStream(
  status: string,
  content: string
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(sseStatus(status));
      controller.enqueue(sseContent(content));
      controller.close();
    },
  });
}
