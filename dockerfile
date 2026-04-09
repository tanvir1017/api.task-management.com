FROM node:lts-alpine

LABEL maintainer="tanvir.swe.work@gmail.com"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm db:generate

EXPOSE 7549

CMD ["pnpm", "start:dev"]