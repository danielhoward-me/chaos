FROM nginx:1.25.2

WORKDIR /build

COPY --from=golang:1.19 /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"
COPY ./ ./

RUN apt-get update
RUN apt-get install -y git
RUN cat ./dev/build-site | sed 's/\r$//' > ./dev/build-site
RUN bash ./dev/build-site
RUN rm -rf /build

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
