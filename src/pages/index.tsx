import { GetStaticProps } from 'next';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import Head from 'next/head';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  // formattedFirstPublicationDate: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: Promise<void>;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [nextPageUri, setNextPageUri] = useState(
    postsPagination.next_page || ''
  );
  const [postList, setPostList] = useState(postsPagination.results);

  function updatePostList(newDataFromPrismic): void {
    if (!newDataFromPrismic || !newDataFromPrismic.results) {
      return;
    }

    const newPosts: Post[] = newDataFromPrismic.results.map(post => {
      const { uid, first_publication_date } = post;
      const { title, subtitle, author } = post.data;

      return {
        uid,
        first_publication_date,
        data: {
          title,
          subtitle,
          author,
        },
      };
    });
    setPostList([...postList, ...newPosts]);
  }

  async function handleLoadPosts(): Promise<void> {
    if (nextPageUri?.length) {
      fetch(nextPageUri)
        .then(response => response.json())
        .then(responseData => {
          setNextPageUri(responseData?.next_page || '');
          updatePostList(responseData);
        });
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling </title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={`${commonStyles.commonSubcontainer} ${styles.posts}`}>
          {postList?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <time>
                    <FiCalendar />
                    {post.first_publication_date
                      ? format(
                          parseISO(post.first_publication_date),
                          'dd MMM yyyy',
                          {
                            locale: ptBR,
                          }
                        ).toLowerCase()
                      : ' unpublished'}
                  </time>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          {nextPageUri?.length > 0 && (
            <button type="button" onClick={handleLoadPosts}>
              Carregar mais posts
            </button>
          )}

          {preview && (
            <aside className={commonStyles.previewButton}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 10,
      ref: previewData?.ref ?? null,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    const { uid, first_publication_date } = post;
    const { title, subtitle, author } = post.data;

    return {
      uid,
      first_publication_date,
      data: {
        title,
        subtitle,
        author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
