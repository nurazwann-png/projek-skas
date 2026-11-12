# Portal PPD Dalat: imej Cloud Run (Next.js standalone)
FROM node:22-slim AS binaan
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim AS jalan
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
COPY --from=binaan /app/.next/standalone ./
COPY --from=binaan /app/.next/static ./.next/static
COPY --from=binaan /app/public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]
