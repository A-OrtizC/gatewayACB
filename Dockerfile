# Imagen base de Node.js sobre Alpine Linux
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias primero
COPY package*.json ./

# Instalar únicamente las dependencias de producción
RUN npm ci --omit=dev

# Copiar el código fuente
COPY src/ ./src/

# Definir el entorno de ejecución
ENV NODE_ENV=production

# Documentar el puerto que utiliza la aplicación
EXPOSE 3000

# Iniciar el API Gateway
CMD ["node", "src/server.js"]