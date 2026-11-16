import styles from './SiteLoader.module.css';

/** The outlined Z with its pulse, glow and passing shine. Size it with `width`. */
export function ZShine({ width }: { width?: string }) {
  return (
    <div className={styles.card} aria-hidden>
      <div className={styles.svgLayer} />
      <div className={styles.innerLayer} style={width ? { width } : undefined} />
    </div>
  );
}
