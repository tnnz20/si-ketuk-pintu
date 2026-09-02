FROM golang:1.25-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -tags timetzdata -o /out/web ./cmd/web

FROM alpine:3.21

RUN apk add --no-cache tzdata \
    && adduser -D -u 10001 appuser

WORKDIR /app
COPY --from=builder /out/web /app/web
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/web"]