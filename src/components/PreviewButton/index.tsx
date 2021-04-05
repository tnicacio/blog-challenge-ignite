import Link from 'next/link';
import commonStyles from '../../styles/common.module.scss';

interface PreviewButtonProps {
  show: boolean;
}

export function PreviewButton({ show }: PreviewButtonProps): JSX.Element {
  return (
    <>
      {show && (
        <aside className={commonStyles.previewButton}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}
