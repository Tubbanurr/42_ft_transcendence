FROM node:18-bullseye

WORKDIR /app

ENV TZ=Europe/Istanbul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update && apt-get install -y \
    python3 make g++ sqlite3 libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install sqlite3 --build-from-source \
    && npm install \
    && npm cache clean --force

COPY --chown=node:node . .

RUN npm run build

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN mkdir -p /app/data /app/uploads/avatars \
    && chown -R node:node /app/data /app/uploads

EXPOSE 3001

USER node

ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "run", "dev"]
