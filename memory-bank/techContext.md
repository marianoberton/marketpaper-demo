# Contexto Técnico
## FOMO Platform - Stack y Configuración

### Stack Tecnológico Actual

#### **Frontend Core**
- **Next.js 15.3.1 (Turbopack)**: App Router, Server Components, Streaming, Turbopack como bundler por defecto
- **TypeScript**: Strict mode, tipos avanzados
- **Tailwind CSS**: Utility-first, custom design tokens
- **React 18**: Concurrent features, Suspense

#### **UI/UX Libraries**
- **Shadcn/ui**: Base component library
- **Lucide React**: Icon system
- **Recharts**: Data visualization
- **Class Variance Authority**: Component variants
- **Tailwind Merge**: Dynamic class composition

#### **State Management**
- **React Context**: Global state management
- **Local Storage**: Persistence layer
- **Custom hooks**: Business logic encapsulation

### Dependencias Actuales

#### **Production Dependencies**
```json
{
  "next": "^15.3.1",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "@radix-ui/react-*": "^1.0.0",
  "lucide-react": "^0.300.0",
  "recharts": "^2.8.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

#### **Development Dependencies**
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^15.3.1",
  "postcss": "^8.0.0",
  "autoprefixer": "^10.0.0"
}
```

### Arquitectura de Expansión

#### **Nuevas Dependencias Requeridas**

##### **Multi-tenant Support**
```json
{
  "@auth0/nextjs-auth0": "^3.0.0",
  "jose": "^5.0.0",
  "iron-session": "^8.0.0"
}
```

##### **Database & ORM**
```json
{
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "postgres": "^3.4.0"
}
```

##### **AI Integration**
```json
{
  "openai": "^4.0.0",
  "@langchain/core": "^0.1.0",
  "ai": "^3.0.0",
  "zod": "^3.22.0"
}
```

##### **Real-time Features**
```json
{
  "socket.io": "^4.7.0",
  "socket.io-client": "^4.7.0",
  "@vercel/kv": "^1.0.0"
}
```

##### **API & Validation**
```json
{
  "trpc": "^10.0.0",
  "@trpc/server": "^10.0.0",
  "@trpc/client": "^10.0.0",
  "@trpc/react-query": "^10.0.0",
  "@tanstack/react-query": "^5.0.0"
}
```

### Configuración del Proyecto

#### **Next.js Configuration**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['prisma']
  },
  images: {
    domains: ['localhost', 'fomo-platform.com']
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  }
};
```

#### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/modules/*": ["./modules/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

#### **Tailwind Configuration**
```typescript
// tailwind.config.ts
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './modules/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'signal-yellow': '#FCCD12',
        'brilliant-blue': '#0077B6',
        'orange-500': '#f97316',
        'plum': '#310629'
      },
      fontFamily: {
        'logo': ['Concert One', 'cursive'],
        'heading': ['Space Grotesk', 'sans-serif'],
        'body': ['Manrope', 'sans-serif']
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
```

### Estructura de Directorios Expandida

```
fomo-platform/
├── app/                          # Next.js App Router
│   ├── (analytics)/             # Analytics module routes
│   ├── (workspace)/             # Workspace module routes  
│   ├── api/                     # API routes
│   └── globals.css              # Global styles
├── components/                   # Shared components
│   ├── ui/                      # Base UI components
│   ├── analytics/               # Analytics-specific
│   ├── workspace/               # Workspace-specific
│   └── shared/                  # Cross-module components
├── lib/                         # Utilities and configurations
│   ├── auth/                    # Authentication logic
│   ├── db/                      # Database utilities
│   ├── ai/                      # AI integration
│   └── utils/                   # General utilities
├── modules/                     # Feature modules
│   ├── analytics/               # Analytics module
│   ├── workspace/               # Workspace module
│   ├── ai-workers/              # AI workers module
│   └── multi-tenant/            # Multi-tenant core
├── types/                       # TypeScript definitions
│   ├── analytics.ts
│   ├── workspace.ts
│   ├── ai.ts
│   └── tenant.ts
├── prisma/                      # Database schema
│   ├── schema.prisma
│   └── migrations/
└── memory-bank/                 # Project documentation
    ├── projectbrief.md
    ├── productContext.md
    ├── systemPatterns.md
    ├── techContext.md
    ├── activeContext.md
    └── progress.md
```

### Variables de Entorno

#### **Development Environment**
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="..."

# Multi-tenant
TENANT_DATABASE_PREFIX="fomo_"
DEFAULT_TENANT_ID="default"

# Feature Flags
ENABLE_WORKSPACE_MODULE="true"
ENABLE_AI_WORKERS="false"
ENABLE_MULTI_TENANT="false"
```

### Herramientas de Desarrollo

#### **Code Quality**
- **ESLint**: Linting con reglas Next.js
- **Prettier**: Formateo de código
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit checks

#### **Testing**
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

#### **Development Tools**
- **Storybook**: Component documentation
- **Prisma Studio**: Database management
- **Next.js DevTools**: Performance monitoring

### Consideraciones de Performance

#### **Bundle Optimization**
- **Turbopack** como bundler por defecto (Next.js 15+)
- **Code splitting** por módulos
- **Dynamic imports** para features opcionales
- **Tree shaking** automático
- **Image optimization** con Next.js

#### **Caching Strategy**
- **Static generation** para páginas públicas
- **ISR** para contenido dinámico
- **Client-side caching** con React Query
- **CDN** para assets estáticos

### Deployment Configuration

#### **Vercel Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### **Docker Configuration**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
``` 