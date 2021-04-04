import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { parseISO, subMonths, format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function getTotalNumberOfWords(): number {
    let parcialTotal = 0;

    const totalWords = post.data.content?.reduce((total, contentItem) => {
      parcialTotal += contentItem.heading?.split(' ').length;
      const wordsOnBody = contentItem.body?.map(
        word => word.text?.split(' ').length
      );
      // eslint-disable-next-line no-return-assign
      wordsOnBody.map(word => (parcialTotal += word));
      return total + parcialTotal;
    }, 0);
    return totalWords;
  }

  function getReadingTimeAsString(): string {
    const totalWords = getTotalNumberOfWords();
    const readingTime = Math.ceil(totalWords / 200);
    return `${readingTime} min`;
  }

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
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt={post.data.title} />
          </div>

          <main className={commonStyles.commonContainer}>
            <article
              className={`${commonStyles.commonSubcontainer} ${styles.post}`}
            >
              <div className={styles.postHeader}>
                <h1>{post.data.title}</h1>

                <div className={styles.info}>
                  <time>
                    <FiCalendar />
                    {format(
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </time>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                  <span>
                    <FiClock /> {getReadingTimeAsString()}
                  </span>
                </div>
              </div>

              <div className={styles.content}>
                <div className={styles.repeatable}>
                  {post.data.content.map((textBlock, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`${textBlock.heading}${index}`}>
                      <div className={styles.headish}>{textBlock.heading}</div>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
      title: response.data.title,
      subtitle: response.data.subtitle,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
