FROM mongo:7

COPY mongo-init.js /docker-entrypoint-initdb.d/01-init.js

ENV MONGO_INITDB_DATABASE=demo-vibe

EXPOSE 27017

CMD ["--replSet", "rs0", "--bind_ip_all"]
