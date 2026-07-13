import styles from "./TagList.module.css";

export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className={styles.list}>
      {tags.map((tag) => (
        <li key={tag} className={styles.tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
