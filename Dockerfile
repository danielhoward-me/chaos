FROM golang:1.19 AS build

WORKDIR /build

COPY ./ ./

RUN apt-get update
RUN apt-get install -y git

RUN cat ./dev/build-site | sed 's/\r$//' > ./dev/build-site
RUN bash ./dev/build-site

FROM nginx:1.25.2

COPY --from=build /var/www /var/www
COPY --from=build /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
