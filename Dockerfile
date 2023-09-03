FROM nginx:1.25.2-alpine

WORKDIR /build

RUN apk add bash
RUN apk add git
RUN git clone https://github.com/danielhoward-me/chaos .
RUN git checkout dnh/nginx
RUN git status
RUN bash ./dev/build-site

# COPY ./docker-build /var/www/chaos.danielhoward.me
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 3500

# CMD ["nginx", "-g", "daemon off;"]
