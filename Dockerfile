FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY core core
COPY server server
COPY dist dist
ENV PORT=8080
EXPOSE 8080
CMD ["node","server/gateway.js"]
