import styles from "./ImageGallery.module.css";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className={styles.gallery}>
      {images.map((src) => (
        <img key={src} src={src} alt={alt} className={styles.image} />
      ))}
    </div>
  );
}
