import styles from './styles.module.scss';

export function Banner({ imgUri, alt }): JSX.Element {
  return (
    <>
      {imgUri && (
        <div className={styles.banner}>
          <img src={imgUri} alt={alt} />
        </div>
      )}
    </>
  );
}
