import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { HtmlRewritingStream } from 'html-rewriter';
import { logger } from 'log';
import { assemble, injectHeader } from './assembly.js';

export async function responseProvider(request) {
  return assemble(
    request,
    {
      httpRequest,
      createResponse,
      report: (message) => logger.error('%s', message),
      rewrite: (body, markup, variant) => {
        const rewriter = new HtmlRewritingStream();
        rewriter.onElement('body > header', (element) => injectHeader(element, markup, variant));
        return body.pipeThrough(rewriter);
      },
    },
    {
      enabled: request.getVariable('PMUSER_EXL_EDGE_HEADER') === '1',
      variant: request.getVariable('PMUSER_EXL_HEADER_VARIANT') || 'header-v2',
    },
  );
}
