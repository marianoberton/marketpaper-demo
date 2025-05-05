// Real-time stats
export const realtimeStats = {
  salesNow: {
    value: 48569,
    target: 50000,
    change: 3.2,
    isUp: true
  },
  activeUsers: {
    value: 237, 
    organic: 152,
    paid: 78,
    direct: 7,
    change: -5.8,
    isUp: false
  },
  ordersToday: {
    value: 42,
    change: 12.5,
    isUp: true 
  },
  conversionRate: {
    value: 3.8,
    change: 0.5,
    isUp: true,
    benchmark: "≥ 2.5%"
  },
  campaignROAS: {
    name: "Flash Sale",
    value: 4.2,
    spend: 25000,
    change: 1.3,
    isUp: true,
    benchmark: "≥ 3x"
  }
};

// User behavior
export const userBehaviorStats = {
  visitsAndSessions: {
    daily: [
      { name: "Lun", sessions: 1250, newUsers: 812, returning: 438 },
      { name: "Mar", sessions: 1420, newUsers: 945, returning: 475 },
      { name: "Mie", sessions: 1380, newUsers: 901, returning: 479 },
      { name: "Jue", sessions: 1590, newUsers: 1050, returning: 540 },
      { name: "Vie", sessions: 1720, newUsers: 1105, returning: 615 },
      { name: "Sab", sessions: 2100, newUsers: 1430, returning: 670 },
      { name: "Dom", sessions: 1890, newUsers: 1245, returning: 645 }
    ],
    weekly: 10350,
    change: 8.2,
    isUp: true
  },
  bounceRate: {
    value: 52.8,
    change: -2.1,
    isUp: false,
    benchmark: "≤ 55%"
  },
  avgSessionDuration: {
    value: 185,
    label: "3:05",
    change: 12.4,
    isUp: true,
    benchmark: "≥ 2:30"
  },
  pagesPerSession: {
    value: 4.3,
    change: 0.5,
    isUp: true,
    benchmark: "≥ 3.5"
  },
  cartAbandonmentRate: {
    value: 68.5,
    change: -3.7,
    isUp: false,
    benchmark: "≤ 65%"
  },
  userFlow: [
    { stage: "Inicio", users: 10000, dropoff: 2500 },
    { stage: "Categoría", users: 7500, dropoff: 2500 },
    { stage: "Producto", users: 5000, dropoff: 2000 },
    { stage: "Carrito", users: 3000, dropoff: 1000 },
    { stage: "Pago", users: 2000, dropoff: 500 },
    { stage: "Compra", users: 1500, dropoff: 0 }
  ],
  topSearches: [
    "cajas carton", 
    "cinta embalaje", 
    "pluribol", 
    "vasos descartables", 
    "bolsas papel"
  ]
};

// Conversion metrics
export const conversionMetrics = {
  conversionRate: {
    value: 3.8,
    change: 0.5,
    isUp: true,
    benchmark: "≥ 2.5%",
    history: [
      { name: "Ene", value: 2.8 },
      { name: "Feb", value: 3.0 },
      { name: "Mar", value: 3.2 },
      { name: "Abr", value: 3.5 },
      { name: "May", value: 3.3 },
      { name: "Jun", value: 3.8 }
    ]
  },
  CAC: {
    value: 580,
    change: -50,
    isUp: false,
    benchmark: "≤ $600"
  },
  ROAS: {
    value: 5.2,
    change: 0.8,
    isUp: true,
    benchmark: "≥ 4x"
  },
  LTV: {
    value: 7850,
    change: 650,
    isUp: true
  },
  AOV: {
    value: 4500,
    change: 320,
    isUp: true,
    benchmark: "$4300"
  },
  channelPerformance: {
    traffic: [
      { name: "Orgánico", value: 42 },
      { name: "Directo", value: 12 },
      { name: "Social", value: 28 },
      { name: "Email", value: 10 },
      { name: "Referido", value: 8 }
    ],
    orders: [
      { name: "Orgánico", value: 38 },
      { name: "Directo", value: 15 },
      { name: "Social", value: 25 },
      { name: "Email", value: 16 },
      { name: "Referido", value: 6 }
    ]
  },
  emailMetrics: {
    deliveryRate: 98.7,
    openRate: 22.5,
    clickRate: 3.8,
    revenue: 650000
  }
};

// Technical performance
export const technicalPerformance = {
  pageSpeed: {
    desktop: {
      value: 87,
      change: 5,
      isUp: true
    },
    mobile: {
      value: 72,
      change: 8,
      isUp: true
    }
  },
  errors: {
    http404: 12,
    http500: 1,
    jsErrors: 5
  },
  uptime: {
    value: 99.97,
    outages: []
  },
  checkoutPerformance: {
    avgTime: 65,
    failedAttempts: 3.2
  },
  pageWeight: {
    avgSize: 1.85,
    requests: 32
  }
};

// Provider performance
export const providerPerformance = {
  wonderAgency: {
    metrics: [
      { name: "ROAS", value: 4.8, target: 4.5, status: "success" },
      { name: "CAC", value: 620, target: 600, status: "warning" },
      { name: "Click-through rate", value: 2.5, target: 2.0, status: "success" },
      { name: "Conversion rate", value: 3.2, target: 3.0, status: "success" }
    ]
  },
  tech: {
    metrics: [
      { name: "Uptime", value: 99.97, target: 99.9, status: "success" },
      { name: "Page speed", value: 82, target: 85, status: "warning" },
      { name: "Bug resolution", value: "24h", target: "48h", status: "success" },
      { name: "Feature delivery", value: "92%", target: "90%", status: "success" }
    ]
  },
  zippin: {
    metrics: [
      { name: "On-time delivery", value: 94, target: 95, status: "warning" },
      { name: "Avg delivery time", value: "2.5 días", target: "3 días", status: "success" },
      { name: "Returns", value: 3.8, target: 5, status: "success" },
      { name: "Shipping cost", value: 850, target: 900, status: "success" }
    ]
  },
  manychat: {
    metrics: [
      { name: "Response time", value: "4 min", target: "5 min", status: "success" },
      { name: "Resolution rate", value: 78, target: 80, status: "warning" },
      { name: "User satisfaction", value: 4.5, target: 4.0, status: "success" },
      { name: "Leads generated", value: 342, target: 300, status: "success" }
    ]
  }
};

// Testing & optimization
export const testingData = {
  activeTests: [
    {
      name: "Nuevo diseño checkout",
      status: "En curso",
      startDate: "2023-06-10",
      metrics: { control: 3.2, variant: 3.8 },
      improvement: 18.7,
      significant: true
    },
    {
      name: "Texto en botones CTA",
      status: "En curso",
      startDate: "2023-06-15",
      metrics: { control: 1.8, variant: 2.1 },
      improvement: 16.6,
      significant: false
    },
    {
      name: "Ubicación formulario suscripción",
      status: "En curso",
      startDate: "2023-06-12",
      metrics: { control: 2.5, variant: 2.6 },
      improvement: 4.0,
      significant: false
    }
  ],
  automationResults: {
    manychat: {
      interactions: 1850,
      resolvedByBot: 1420,
      escalatedToHuman: 430,
      cartsRecovered: 85,
      revenueGenerated: 382500
    },
    emailAutomation: {
      welcomeSequence: {
        sent: 645,
        opened: 402,
        clicked: 185,
        converted: 52
      },
      abandonedCart: {
        sent: 524,
        opened: 310,
        clicked: 196,
        recovered: 78
      }
    }
  }
};

// Sales data
export const salesData = {
  revenueByDay: [
    { name: "Lun", revenue: 48569 },
    { name: "Mar", revenue: 52830 },
    { name: "Mie", revenue: 49950 },
    { name: "Jue", revenue: 58745 },
    { name: "Vie", revenue: 62310 },
    { name: "Sab", revenue: 71200 },
    { name: "Dom", revenue: 65480 }
  ],
  revenueByWeek: [
    { name: "Sem 1", revenue: 195870 },
    { name: "Sem 2", revenue: 210450 },
    { name: "Sem 3", revenue: 205600 },
    { name: "Sem 4", revenue: 221300 }
  ],
  revenueByMonth: [
    { name: "Ene", revenue: 810500 },
    { name: "Feb", revenue: 785300 },
    { name: "Mar", revenue: 832100 },
    { name: "Abr", revenue: 885600 },
    { name: "May", revenue: 840200 },
    { name: "Jun", revenue: 905000 }
  ],
  topProducts: [
    { name: "Cajas de Cartón Corrugado 40x30x30", units: 850, revenue: 631030 },
    { name: "Rollo Pluribol Transparente 50cm x 50mts", units: 720, revenue: 495360 },
    { name: "Cinta Adhesiva Transparente 48mm x 100yds", units: 1500, revenue: 701670 },
    { name: "Vaso Plástico Descartable Blanco 180cc", units: 3500, revenue: 223888 },
    { name: "Bolsas De Papel Kraft Con Manija", units: 1100, revenue: 212113 }
  ],
  topCategories: [
    { name: "Cajas de Cartón", revenue: 1850000, growth: 9.5 },
    { name: "Insumos Embalaje", revenue: 1450000, growth: 11.2 },
    { name: "Gastronomia Descartable", revenue: 1200000, growth: 7.8 },
    { name: "Bolsas", revenue: 950000, growth: 5.1 }
  ],
  paymentMethods: [
    { name: "Mercado Pago", value: 65 },
    { name: "Tarjeta de Crédito", value: 25 },
    { name: "Transferencia", value: 8 },
    { name: "Otros", value: 2 }
  ]
};

// Marketing data
export const marketingData = {
  overall: {
    roas: 5.2, 
    cac: 580,
    spend: 1500000,
    conversions: 2586
  },
  metaAds: {
    roas: 4.8,
    spend: 900000,
    impressions: 1250000,
    clicks: 25000,
    ctr: 2.0,
    conversions: 1350,
    cpa: 667,
    revenue: 4320000,
    history: [
      { name: "Ene", value: 4.2 },
      { name: "Feb", value: 4.5 },
      { name: "Mar", value: 4.3 },
      { name: "Abr", value: 4.9 },
      { name: "May", value: 4.7 },
      { name: "Jun", value: 4.8 }
    ]
  },
  googleAds: {
    roas: 6.1,
    spend: 600000,
    impressions: 800000,
    clicks: 18000,
    ctr: 2.25,
    conversions: 1236,
    cpa: 485,
    revenue: 3660000,
    history: [
      { name: "Ene", value: 5.5 },
      { name: "Feb", value: 5.8 },
      { name: "Mar", value: 5.6 },
      { name: "Abr", value: 6.3 },
      { name: "May", value: 6.0 },
      { name: "Jun", value: 6.1 }
    ]
  },
  topCampaigns: [
    {
      platform: "Google",
      name: "Búsqueda - Cajas Corrugado Standard",
      spend: 120000,
      revenue: 852000,
      roas: 7.1,
      conversions: 180,
      cpa: 667
    },
    {
      platform: "Meta",
      name: "Retargeting - Insumos Embalaje",
      spend: 150000,
      revenue: 975000,
      roas: 6.5,
      conversions: 210,
      cpa: 714
    },
    {
      platform: "Google",
      name: "Shopping - Descartables Gastronomia",
      spend: 80000,
      revenue: 512000,
      roas: 6.4,
      conversions: 115,
      cpa: 696
    },
    {
      platform: "Meta",
      name: "Lookalike - Compradores Cajas Ecommerce",
      spend: 200000,
      revenue: 1100000,
      roas: 5.5,
      conversions: 240,
      cpa: 833
    },
    {
      platform: "Meta",
      name: "Intereses - Kits Mudanza",
      spend: 180000,
      revenue: 810000,
      roas: 4.5,
      conversions: 195,
      cpa: 923
    }
  ]
};

// Weekly report summary
export const weeklyReport = {
  kpis: [
    { name: "Ingresos", value: "$215.8K", change: 12.5, isUp: true },
    { name: "Pedidos", value: 890, change: 8.8, isUp: true },
    { name: "Tasa Conv.", value: "3.9%", change: 0.3, isUp: true },
    { name: "ROAS", value: "5.4x", change: 0.6, isUp: true },
    { name: "Ticket Promedio", value: "$4,850", change: 150, isUp: true }
  ],
  highlights: [
    "Campaña de Google Ads para Cajas Corrugado superó el 7x ROAS.",
    "Aumento de ventas en Descartables Gastronómicos (+18%).",
    "Stock bajo en Rollo Pluribol de 50cm.",
    "Tasa de conversión en Bolsas para ECommerce mejoró al 4.2%."
  ],
  channelPerformance: [
    { channel: "Meta Ads", revenue: 85000, sessions: 12000, orders: 180 },
    { channel: "Google Ads", revenue: 72000, sessions: 9500, orders: 155 },
    { channel: "Orgánico", revenue: 45000, sessions: 15000, orders: 95 }
  ]
};

// New data for Channel Distribution Donut Chart
export const channelDistributionData = [
  { name: "Orgánico", value: 35, fill: "#6366F1" }, // Indigo
  { name: "Redes Sociales", value: 30, fill: "#EC4899" }, // Pink
  { name: "Email", value: 15, fill: "#10B981" }, // Emerald
  { name: "Directo", value: 12, fill: "#F59E0B" }, // Amber
  { name: "Referidos", value: 8, fill: "#3B82F6" }, // Blue
];

// New data for Chat Page
export const chatData = {
  kpis: {
    totalInteractions: { value: 1850, change: 12, isUp: true, description: "vs mes anterior" },
    botResolutionRate: { value: 77, target: 80, unit: "%", description: "Consultas automatizadas" },
    cartsRecovered: { value: 85, description: "Vía chat" },
    revenueGenerated: { value: 382500, description: "Desde chat" },
    avgResponseTime: { value: 4, unit: "min", target: 5, description: "Respuesta humana" },
    userSatisfaction: { value: 4.5, target: 4, unit: "/5", description: "Promedio" },
    leadsGenerated: { value: 342, target: 300, description: "Nuevos contactos" }
  },
  conversationFlow: [
    { stage: "Bienvenida", users: 1850, percentage: 100, description: "Mensaje inicial" },
    { stage: "Menú principal", users: 1795, percentage: 97, description: "Selección de consulta" },
    { stage: "Consulta específica", users: 1500, percentage: 81, description: "Interacción predefinida" },
    { stage: "Resolución automatizada", users: 1420, percentage: 77, description: "Resuelto por bot" },
    { stage: "Contacto con asesor", users: 430, percentage: 23, description: "Derivación humana" }
  ],
  frequentTopics: [
    { name: "Estado del pedido", value: 45, fill: "#8884d8" },
    { name: "Info producto", value: 25, fill: "#82ca9d" },
    { name: "Problema pago", value: 15, fill: "#ffc658" },
    { name: "Consultas envío", value: 10, fill: "#ff8042" },
    { name: "Otros", value: 5, fill: "#d1d5db" },
  ]
};

// New data for CRM Page
export const crmData = {
  kpis: {
    totalCustomers: { value: 15890, change: 5.2, isUp: true },
    newLeadsMonthly: { value: 450, change: 15, isUp: true }
    // LTV will be taken from conversionMetrics.LTV
  },
  leadSources: [
    { name: "Formulario Web", value: 40, fill: "#3b82f6" }, // Blue
    { name: "Chatbot", value: 30, fill: "#10b981" }, // Emerald
    { name: "Email Marketing", value: 15, fill: "#f59e0b" }, // Amber
    { name: "Manual", value: 10, fill: "#6b7280" }, // Gray
    { name: "Otros", value: 5, fill: "#ef4444" } // Red
  ],
  customerSegments: [
    { name: "VIP (Compra > $50K)", value: 850, fill: "#a855f7" }, // Purple
    { name: "Recurrentes (3+ comp.)", value: 3500, fill: "#22c55e" }, // Green
    { name: "Nuevos (Últimos 90d)", value: 2100, fill: "#3b82f6" }, // Blue
    { name: "En Riesgo (Inactivo > 180d)", value: 1200, fill: "#f59e0b" }, // Amber
    { name: "Otros", value: 8240, fill: "#d1d5db" } // Light Gray
  ],
  salesPipeline: [
    { stage: "Contacto Inicial", count: 50, value: 1500000 },
    { stage: "Propuesta Enviada", count: 35, value: 2500000 },
    { stage: "Negociación", count: 20, value: 1800000 },
    { stage: "Cierre Esperado", count: 15, value: 1200000 }
  ],
  supportSummary: {
    openTickets: 25,
    avgResolutionTimeHours: 18,
    satisfactionScore: 4.3 // Out of 5
  }
};

// Updated data for Social Media B2B Page (Multi-platform)
export const socialMediaB2BData = {
  summaryKpis: {
    totalWebsiteClicks: { value: 1450, change: 18.0, isUp: true },
    totalLeadsGenerated: { value: 62, change: 25.5, isUp: true },
    // Keep specific LinkedIn KPIs prominent
    linkedinImpressions: { value: 75800, change: 15.2, isUp: true },
    linkedinProfileVisits: { value: 1250, change: 8.1, isUp: true },
  },
  platforms: {
    linkedin: {
      name: "LinkedIn",
      impressions: 75800,
      reach: 48000,
      profileVisits: 1250,
      followerGrowth: 215,
      websiteClicks: 980,
      shares: 130,
      comments: 75,
      saves: 50, // Maybe saves of articles/posts
      sessions: 850,
      bounceRate: 42.0,
      pagesPerSession: 3.5,
      leadsGenerated: 45,
      leadConversionRate: 5.3, // (45/850)*100
    },
    facebook: {
      name: "Facebook",
      impressions: 110500,
      reach: 75000,
      profileVisits: 800,
      followerGrowth: 150,
      websiteClicks: 320,
      shares: 20,
      comments: 10,
      saves: 180,
      sessions: 200,
      bounceRate: 65.5,
      pagesPerSession: 1.8,
      leadsGenerated: 10,
      leadConversionRate: 5.0, // (10/200)*100
    },
    instagram: {
      name: "Instagram",
      impressions: 150200,
      reach: 95000,
      profileVisits: 1100,
      followerGrowth: 310,
      websiteClicks: 150, // Clicks from Bio link primarily
      shares: 0, // Less common
      comments: 5,
      saves: 450, // High for visual content
      sessions: 100,
      bounceRate: 75.0,
      pagesPerSession: 1.5,
      leadsGenerated: 7,
      leadConversionRate: 7.0, // (7/100)*100 - maybe high intent clicks from bio
    },
    // Add Pinterest if needed
  },
  aggregated: {
    // Calculate aggregated values if needed, e.g., total reach across platforms
    totalReach: 150000, // Example, needs careful calculation (deduplication)
    totalShares: 150, // LI + FB
    totalComments: 90, // LI + FB + IG
    totalSaves: 680, // LI + FB + IG
    overallInteractionRate: 2.5, // Example calculation
    overallLeadConversionRate: 5.4, // (62 / (850+200+100)) * 100
    assistedConversions: 15, 
  },
   trafficQuality: {
    // Can keep aggregated or remove if table covers specifics
    topLandingPages: [
      "/productos/cajas-personalizadas",
      "/contacto",
      "/blog/ultimas-tendencias-packaging",
      "/galeria-proyectos"
    ]
  },
  contentPerformance: {
    topPosts: [
      { platform: "LinkedIn", title: "Nuevo acabado ecológico para cajas", clicks: 120, leads: 8, metricType: "Leads" },
      { platform: "Instagram", title: "Reel: Proceso de troquelado personalizado", clicks: 30, leads: 2, saves: 80, metricType: "Saves" },
      { platform: "Facebook", title: "Caso de éxito: Packaging para Vinos Premium", clicks: 95, leads: 6, metricType: "Clicks" },
      { platform: "LinkedIn", title: "Artículo: Sostenibilidad en Packaging B2B", clicks: 110, leads: 5, metricType: "Leads" },
      { platform: "Instagram", title: "Carrusel: Diseños Cajas E-commerce", clicks: 25, leads: 1, saves: 120, metricType: "Saves" },
    ]
  }
}; 