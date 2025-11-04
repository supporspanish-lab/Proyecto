# Imagen base liviana
FROM alpine:latest

# Instala wget y unzip
RUN apk add --no-cache wget unzip

# Crea carpeta de trabajo
WORKDIR /app

# 🔽 Descarga automáticamente la última versión de PocketBase (para Linux 64 bits)
RUN wget $(wget -qO- https://api.github.com/repos/pocketbase/pocketbase/releases/latest \
    | grep browser_download_url | grep linux_amd64.zip | cut -d '"' -f 4) -O pocketbase.zip \
    && unzip pocketbase.zip \
    && rm pocketbase.zip

# Copia tu proyecto al contenedor
COPY . .

# Expone el puerto 8090
EXPOSE 8090

# 🏁 Comando de inicio
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
