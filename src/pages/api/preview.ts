/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Document } from '@prismicio/client/types/documents';

import Prismic from '@prismicio/client';

interface IClient {
  req?: unknown;
  accessToken?: string;
}

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

const apiEndpoint = process.env.PRISMIC_API_ENDPOINT;
const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

// Client method to query from the Prismic repo
const Client = (req = null) => {
  function createClientOptions(
    requisition = null,
    prismicAccessToken = null
  ): IClient {
    const reqOption = requisition ? { req: requisition } : {};
    const accessTokenOption = prismicAccessToken
      ? { accessToken: prismicAccessToken }
      : {};
    return {
      ...reqOption,
      ...accessTokenOption,
    };
  }

  return Prismic.client(apiEndpoint, createClientOptions(req, accessToken));
};

const Preview = async (req, res): Promise<unknown> => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await Client(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();

  return res;
};

export default Preview;
