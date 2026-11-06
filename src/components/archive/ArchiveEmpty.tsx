import { PaisleyCorner } from "@/components/paisley";
import { COPY } from "@/lib/site";
import styles from "./ArchiveEmpty.module.css";

export function ArchiveEmpty({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={styles.empty}>
      <PaisleyCorner position="tl" className={`${styles.c} ${styles.tl}`} />
      <PaisleyCorner position="br" className={`${styles.c} ${styles.br}`} />
      <H className={`display ${styles.title}`}>{COPY.archiveEmpty}</H>
      <p className={styles.text}>
        Recaps, photos, playlists and the drink of every gathering will live here. Gathering No.&nbsp;01 writes the first
        chapter.
      </p>
    </div>
  );
}
