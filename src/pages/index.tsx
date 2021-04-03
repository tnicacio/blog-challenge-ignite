import { GetStaticProps } from 'next';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
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
}

export default function Home(): JSX.Element {
  return (
    <main className={commonStyles.container}>
      <div className={`${commonStyles.commonSubcontainer} ${styles.posts}`}>
        <Link href="/">
          <a>
            <strong>Como utilizar Hooks e tal bla ble bli blo</strong>
            <p>Pensando em sincronização em vez de ciclos de vida</p>
            <div className={styles.info}>
              <time>
                <FiCalendar /> 15 mar 2021
              </time>
              <span>
                <FiUser /> Joseph Oliveira
              </span>
            </div>
          </a>
        </Link>
        <Link href="/">
          <a>
            <strong>Como utilizar Hooks</strong>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Veniam
              modi molestiae minus temporibus amet eius ducimus eveniet
              consectetur aliquam officia. Pensando em sincronização em vez de
              ciclos de vida
            </p>
            <div className={styles.info}>
              <time>
                <FiCalendar /> 15 mar 2021
              </time>
              <span>
                <FiUser /> Joseph Oliveira
              </span>
            </div>
          </a>
        </Link>
        <Link href="/">
          <a>
            <strong>Como utilizar Hooks</strong>
            <p>Pensando em sincronização em vez de ciclos de vida</p>
            <div className={styles.info}>
              <time>
                <FiCalendar /> 15 mar 2021
              </time>
              <span>
                <FiUser /> Joseph Oliveira
              </span>
            </div>
          </a>
        </Link>

        <button type="button">Carregar mais posts</button>
      </div>
    </main>
  );
}

// export const getStaticProps = async () => {
//   // const prismic = getPrismicClient();
//   // const postsResponse = await prismic.query(TODO);

//   // TODO
// };
