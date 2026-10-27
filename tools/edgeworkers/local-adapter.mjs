import { parse, parseFragment, serialize } from 'parse5';
import { injectHeader } from './header/assembly.js';

export function adaptResponse(response) {
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name] = [value];
  });
  if (response.headers.getSetCookie().length) headers['set-cookie'] = response.headers.getSetCookie();
  return {
    status: response.status,
    body: response.body,
    text: () => response.text(),
    getHeader: (name) => headers[name.toLowerCase()],
    getHeaders: () => headers,
  };
}

export function createResponse(status, headers, body) {
  return { status, headers, body };
}

export function rewrite(body, markup, variant) {
  // This parser adapter buffers the page. Only the Akamai adapter is streaming.
  return new ReadableStream({
    async start(controller) {
      try {
        const document = parse(await new Response(body).text());
        const html = document.childNodes.find((node) => node.tagName === 'html');
        const bodyNode = html.childNodes.find((node) => node.tagName === 'body');
        bodyNode.childNodes
          .filter((node) => node.tagName === 'header')
          .forEach((node) => {
            injectHeader(
              {
                getAttribute: (name) => node.attrs.find((attr) => attr.name === name)?.value,
                setAttribute: (name, value) => node.attrs.push({ name, value }),
                prepend: (value) => {
                  const fragment = parseFragment(value);
                  fragment.childNodes.forEach((child) => {
                    child.parentNode = node;
                  });
                  node.childNodes.unshift(...fragment.childNodes);
                },
              },
              markup,
              variant,
            );
          });
        controller.enqueue(new TextEncoder().encode(serialize(document)));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
