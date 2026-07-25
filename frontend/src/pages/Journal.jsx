import React from "react";
import { Calendar, ArrowRight } from "lucide-react";

const articles = [
  {
    id: 1,
    title: "The Art of Timeless Fashion",
    date: "July 20, 2026",
    category: "Style Guide",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80",
    excerpt:
      "Discover how timeless wardrobe essentials can elevate your everyday style while embracing sustainability and elegance.",
  },
  {
    id: 2,
    title: "Behind the Atelier Collection",
    date: "July 12, 2026",
    category: "Collections",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80",
    excerpt:
      "Explore the inspiration, craftsmanship, and creative process behind our newest luxury collection.",
  },
  {
    id: 3,
    title: "Minimalism Meets Luxury",
    date: "July 5, 2026",
    category: "Lifestyle",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80",
    excerpt:
      "Less is more. Learn how minimalist fashion creates a sophisticated and effortless wardrobe.",
  },
];

const Journal = () => {
  return (
    <div className="bg-atelier-beige min-h-screen">

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="font-serif text-5xl md:text-6xl text-atelier-dark mb-6">
          The Journal
        </h1>

        <p className="max-w-2xl mx-auto text-atelier-gray text-lg leading-8">
          Stories about fashion, craftsmanship, sustainability, and the people
          behind Atelier.
        </p>
      </section>

      {/* Featured Article */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=80"
            alt="Featured"
            className="rounded-lg object-cover h-[450px] w-full"
          />

          <div>

            <p className="uppercase tracking-[0.3em] text-sm text-atelier-gray mb-4">
              Featured Story
            </p>

            <h2 className="font-serif text-4xl text-atelier-dark mb-6">
              Crafting Modern Elegance
            </h2>

            <p className="text-atelier-gray leading-8 mb-8">
              Every Atelier piece begins with a vision of timeless elegance.
              From carefully selected fabrics to expert craftsmanship, every
              detail is designed to create garments that transcend trends.
            </p>

            <button className="inline-flex items-center gap-2 border border-atelier-dark px-6 py-3 hover:bg-atelier-dark hover:text-white transition">
              Read Story
              <ArrowRight size={18} />
            </button>

          </div>

        </div>
      </section>

      {/* Articles */}
      <section className="max-w-6xl mx-auto px-6 pb-24">

        <h2 className="font-serif text-3xl mb-10 text-atelier-dark">
          Latest Articles
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">

          {articles.map((article) => (
            <article
              key={article.id}
              className="group"
            >
              <img
                src={article.image}
                alt={article.title}
                className="h-80 w-full object-cover rounded-lg mb-5 transition duration-300 group-hover:scale-[1.02]"
              />

              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-atelier-gray mb-3">
                <Calendar size={14} />
                {article.date}
              </div>

              <p className="uppercase text-xs tracking-[0.2em] text-atelier-gray mb-2">
                {article.category}
              </p>

              <h3 className="font-serif text-2xl text-atelier-dark mb-3">
                {article.title}
              </h3>

              <p className="text-atelier-gray leading-7 mb-5">
                {article.excerpt}
              </p>

              <button className="inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">
                Read More
                <ArrowRight size={18} />
              </button>
            </article>
          ))}

        </div>

      </section>

    </div>
  );
};

export default Journal;