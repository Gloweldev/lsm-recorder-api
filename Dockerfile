# Dockerfile para LSM Web Recorder Backend - Producción
FROM node:22-alpine AS builder

# Instalar dependencias necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies si es necesario)
RUN npm install --production

# Etapa final
FROM node:22-alpine

WORKDIR /app

# Copiar node_modules desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar package.json
COPY package*.json ./

# Copiar código fuente
COPY src ./src

# Exponer puerto
EXPOSE 5000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Comando de inicio
CMD ["node", "src/server.js"]
