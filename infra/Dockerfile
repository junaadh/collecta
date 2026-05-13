FROM oven/bun:1 AS dev

WORKDIR /app

COPY package.json package-lock.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

ENV PATH="/app/node_modules/.bin:${PATH}"

CMD ["bun", "run", "dev"]
