FROM alpine:3.20.3

RUN apk update && apk add --no-cache nginx openssl bash

RUN mkdir -p /run/nginx/html

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 443

ENTRYPOINT ["/entrypoint.sh"]
