# Dockerfile para LSM Web Recorder Backend - Producción
FROM node:22-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY src ./src

# Exponer puerto
EXPOSE 5000

# Variables de entorno por defecto (se sobrescriben en docker-compose)
ENV NODE_ENV=production
ENV PORT=5000

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Comando de inicio
CMD ["node", "src/server.js"]
