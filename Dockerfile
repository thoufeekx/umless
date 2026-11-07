# Umless web app. Debian 13 (trixie) ships ffmpeg 7.x, which supports the `-/filter_complex <file>` syntax the
# pipeline uses (Debian 12's ffmpeg 5.1 does not).
FROM node:22-trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
# next/react are devDependencies (so `npx umless` does not install them), so the image keeps dev deps.
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3210
CMD ["npm", "start"]
