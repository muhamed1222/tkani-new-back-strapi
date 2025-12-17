import type { Schema, Struct } from '@strapi/strapi';

export interface CartCartItem extends Struct.ComponentSchema {
  collectionName: 'components_cart_cart_items';
  info: {
    description: '';
    displayName: '\u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u043A\u043E\u0440\u0437\u0438\u043D\u044B';
    icon: 'shopping-cart';
  };
  attributes: {
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_order_items';
  info: {
    description: '\u0422\u043E\u0432\u0430\u0440 \u0432 \u0437\u0430\u043A\u0430\u0437\u0435 \u0441 \u043C\u0435\u0442\u0440\u0430\u0436\u043E\u043C';
    displayName: '\u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u0437\u0430\u043A\u0430\u0437\u0430';
  };
  attributes: {
    meters: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.1;
        },
        number
      >;
    price: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    price_per_meter: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    total: Schema.Attribute.Decimal & Schema.Attribute.Private;
  };
}

export interface SeoSeoFields extends Struct.ComponentSchema {
  collectionName: 'components_seo_seo_fields';
  info: {
    description: 'SEO \u043F\u043E\u043B\u044F \u0434\u043B\u044F \u043C\u0435\u0442\u0430-\u0442\u0435\u0433\u043E\u0432 \u0438 Open Graph';
    displayName: 'SEO Fields';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    ogDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'cart.cart-item': CartCartItem;
      'order.order-item': OrderOrderItem;
      'seo.seo-fields': SeoSeoFields;
    }
  }
}
