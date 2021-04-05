import Link from 'next/link';
import defaultStyles from './styles.module.scss';

interface PostsNavigationProps {
  postToGo: {
    uid?: string;
    title?: string;
  };
  explanationLabel?: string;
  styles?: React.CSSProperties;
}

export function PostsNavigation({
  postToGo,
  explanationLabel,
  styles,
}: PostsNavigationProps): JSX.Element {
  return (
    <div className={defaultStyles.footerLink} style={{ ...styles }}>
      <Link href={`/post/${postToGo.uid}`}>
        <a>
          <h2>{postToGo.title}</h2>
          {explanationLabel && <p>{explanationLabel}</p>}
        </a>
      </Link>
    </div>
  );
}
