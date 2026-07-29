FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    python3 \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 5001

# The database URL is available only at container runtime on Render. Seed before
# starting the API so corrected built-in test data is applied on every deploy.
CMD ["sh", "-c", "node prisma/seed.js && node src/index.js"]
