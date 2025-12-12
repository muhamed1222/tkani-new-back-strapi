'use strict';

module.exports = ({ strapi }) => ({
  /**
   * Генерация мета-тегов для страницы
   */
  generateMetaTags(data) {
    const {
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
    } = data;

    return {
      title: metaTitle || '',
      description: metaDescription || '',
      openGraph: {
        title: ogTitle || metaTitle || '',
        description: ogDescription || metaDescription || '',
        image: ogImage || null,
        url: canonicalUrl || null,
      },
    };
  },

  /**
   * Генерация JSON-LD схемы для продукта
   */
  generateProductSchema(product) {
    const baseUrl = strapi.config.get('server.url') || 'https://centr-tkani.ru';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.image?.url ? `${baseUrl}${product.image.url}` : null,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'RUB',
        availability: product.stock > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
      },
      aggregateRating: product.reviews_count > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews_count,
      } : null,
    };
  },

  /**
   * Генерация JSON-LD схемы для категории
   */
  generateCategorySchema(category) {
    const baseUrl = strapi.config.get('server.url') || 'https://centr-tkani.ru';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.seo?.metaDescription || category.name,
      url: `${baseUrl}/category/${category.slug}`,
    };
  },
});
