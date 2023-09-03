FROM nginx:1.25.2

WORKDIR /build

COPY ./ ./
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN apt-get update
RUN apt-get install -y git
RUN cat ./dev/build-site | sed 's/\r$//' > ./dev/build-site
RUN bash ./dev/build-site
RUN rm -rf /build

EXPOSE 80

CMD ["nginx"]
