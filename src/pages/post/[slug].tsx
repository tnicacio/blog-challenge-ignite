import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { parseISO, subMonths, format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { ptBR } from 'date-fns/locale';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { PreviewButton } from '../../components/PreviewButton';
import { Banner } from '../../components/Banner';
import { PostsNavigation } from '../../components/PostsNavigation';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date?: string | null;
  last_publication_date?: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface AdjacentPost {
  uid?: string;
  title?: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: AdjacentPost;
  previousPost: AdjacentPost;
}

export default function Post({
  post,
  preview,
  nextPost,
  previousPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const totalReadingTimeInMinutes = post?.data.content.reduce(
    (sum, content) => {
      const numberOfWords = RichText.asText(content.body)?.split(' ')?.length;
      const readingTime = Math.ceil((sum + numberOfWords) / 200);
      return readingTime;
    },
    0
  );

  const formatDateAsPtBrString = (date: string): string => {
    return date
      ? format(parseISO(date), 'dd MMM yyyy', {
          locale: ptBR,
        }).toLowerCase()
      : ' unpublished';
  };

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />

      {router?.isFallback ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <>
          <Banner imgUri={post.data.banner?.url} alt={post.data.title} />
          <main className={commonStyles.commonContainer}>
            <div className={commonStyles.commonSubcontainer}>
              <article className={styles.post}>
                <div className={styles.postHeader}>
                  <h1>{post.data.title}</h1>

                  <div className={styles.info}>
                    <time>
                      <FiCalendar />
                      {formatDateAsPtBrString(post.first_publication_date)}
                    </time>
                    <span>
                      <FiUser /> {post.data.author}
                    </span>
                    <span>
                      <FiClock /> {totalReadingTimeInMinutes} min
                    </span>
                  </div>

                  <div className={styles.lastEdited}>
                    {post.last_publication_date &&
                      format(
                        parseISO(post.last_publication_date),
                        "'*editado em' dd MMM yyyy', às ' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
                  </div>
                </div>

                <div className={styles.content}>
                  <div className={styles.repeatable}>
                    {post.data.content.map(textBlock => (
                      // eslint-disable-next-line react/no-array-index-key
                      <div key={`${textBlock.heading}-${post.data.title}`}>
                        <div className={styles.headish}>
                          {textBlock.heading}
                        </div>
                        <div
                          className={styles.bodyish}
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{
                            __html: RichText.asHtml(textBlock.body),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <div className={styles.footer}>
                {previousPost?.uid && (
                  <PostsNavigation
                    postToGo={previousPost}
                    explanationLabel="Post anterior"
                    styles={{ textAlign: 'left', marginRight: 'auto' }}
                  />
                )}
                {nextPost?.uid && (
                  <PostsNavigation
                    postToGo={nextPost}
                    explanationLabel="Próximo post"
                    styles={{ textAlign: 'right', marginLeft: 'auto' }}
                  />
                )}
              </div>

              <Comments />
            </div>

            <PreviewButton show={preview} />
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts'),
      Prismic.predicates.dateAfter(
        'document.first_publication_date',
        subMonths(new Date(), 1)
      ),
    ],
    {
      orderings: '[posts.first_publication_date desc]',
      fetch: ['posts.uid'],
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner?.url || null,
      },
      content: response.data.content,
      title: response.data.title,
      subtitle: response.data.subtitle,
    },
  };

  const formatAdjacentPost = (
    responsePost: ApiSearchResponse
  ): AdjacentPost => {
    const formattedPost = {} as AdjacentPost;

    const samePost = responsePost.results[0]?.uid === slug;
    if (responsePost?.results_size > 0 && !samePost) {
      formattedPost.uid = responsePost.results[0].uid;
      formattedPost.title = responsePost.results[0].data.title;
    }
    return formattedPost;
  };

  const getAdjacentPostFormatted = async (
    adjacent: 'previous' | 'next'
  ): Promise<AdjacentPost | null> => {
    const defaultOrdering = 'document.first_publication_date';
    const orderingsOptions = {
      previous: `[${defaultOrdering} desc]`,
      next: `[${defaultOrdering}]`,
    };

    const responsePost = await prismic.query(
      Prismic.Predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        orderings: orderingsOptions[adjacent],
        after: response.id,
      }
    );

    const formattedPost = formatAdjacentPost(responsePost);
    return formattedPost;
  };

  const previousPost = await getAdjacentPostFormatted('previous');
  const nextPost = await getAdjacentPostFormatted('next');

  return {
    props: {
      post,
      previousPost,
      nextPost,
      preview,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
