const PLACEHOLDER_IMAGES = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  src: `https://placehold.co/600x600/1a1a1a/c9a96e?text=Dance+${i + 1}`,
  alt: `Dance performance ${i + 1}`,
}));

export default function Gallery() {
  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="section-label">Our Moments</p>
          <h1>Gallery</h1>
          <p>Performances, rehearsals, and studio life.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {PLACEHOLDER_IMAGES.map((img) => (
              <div className="gallery-item" key={img.id}>
                <img src={img.src} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
