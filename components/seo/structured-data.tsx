export function OrganizationStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brio.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Brio",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    description:
      "La mejor aplicación de finanzas personales en Costa Rica. Controla tu presupuesto en colones y dólares, gestiona gastos recurrentes, suscripciones e ingresos.",
    url: siteUrl,
    author: {
      "@type": "Organization",
      name: "Parallax Solutions",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Parallax Solutions",
    },
    inLanguage: ["es-CR", "en-US"],
    countryOfOrigin: {
      "@type": "Country",
      name: "Costa Rica",
    },
    featureList: [
      "Multi-currency budget management",
      "Expense tracking",
      "Income management",
      "Recurring payments",
      "Subscription management",
      "Savings goals",
      "Exchange rate conversion",
      "Financial reports and charts",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brio.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Brio",
    alternateName: "Brio Finance App",
    url: siteUrl,
    description:
      "App de finanzas personales para Costa Rica con soporte multi-moneda",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["es-CR", "en-US"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function LocalBusinessStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Parallax Solutions - Brio",
    description: "Desarrolladores de Brio, la app de finanzas personales #1 en Costa Rica",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CR",
      addressRegion: "San José",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "9.9281",
      longitude: "-84.0907",
    },
    areaServed: {
      "@type": "Country",
      name: "Costa Rica",
    },
    priceRange: "Gratis",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function FAQStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Brio es gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, Brio es completamente gratis. No hay cargos ocultos ni suscripciones premium requeridas para usar todas las funciones.",
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo usar Brio con colones y dólares?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, Brio soporta múltiples monedas incluyendo colones costarricenses (CRC) y dólares estadounidenses (USD). Puedes configurar tu moneda base y agregar tipos de cambio personalizados.",
        },
      },
      {
        "@type": "Question",
        name: "¿Mis datos están seguros en Brio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutamente. Brio utiliza encriptación de nivel bancario para proteger todos tus datos financieros. Tu información nunca es compartida con terceros.",
        },
      },
      {
        "@type": "Question",
        name: "¿Funciona Brio en mi celular?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, Brio es 100% responsivo y funciona perfectamente en cualquier dispositivo: computadora, tablet o celular. Solo necesitas un navegador web.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
