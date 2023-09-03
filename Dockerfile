FROM nginx:1.25.2

WORKDIR /build

COPY ./ ./

RUN apt-get update
RUN apt-get install -y git
RUN cat ./dev/build-site | sed 's/\r$//' > ./dev/build-site
RUN bash ./dev/build-site

# COPY ./docker-build /var/www/chaos.danielhoward.me
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 3500

# CMD ["nginx", "-g", "daemon off;"]
