# Build static dashboard
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_OLLAMA_MODEL=llama3.2:latest
ENV VITE_OLLAMA_MODEL=$VITE_OLLAMA_MODEL
RUN npm run build

# Serve with nginx (+ optional /ollama proxy to host)
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV FLY_API_TOKEN=""
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${FLY_API_TOKEN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
