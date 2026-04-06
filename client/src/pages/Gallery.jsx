const PLACEHOLDER_IMAGES = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  src: `https://placehold.co/400x400/1a1a2e/e91e63?text=Dance+${i + 1}`,
  alt: `Dance performance ${i + 1}`,
}));

export default function Gallery() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Gallery</h2>
        <div className="gallery-grid">
          {PLACEHOLDER_IMAGES.map((img) => (
            <div className="gallery-item" key={img.id}>
              <img src={img.src} alt={img.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
