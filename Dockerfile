ARG SENTRY_AUTH_TOKEN

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package.json yarn.lock ./
COPY public ./public

# Install dependencies
RUN yarn install

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
COPY --from=development /app/node_modules ./node_modules
COPY --from=development /app/public ./public

# Install `sentry-cli` globally
RUN yarn global add @sentry/cli

# Build the application
RUN yarn build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy necessary files from build stage
COPY --from=build /app/package.json ./
COPY --from=build /app/yarn.lock ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public

# Install `sentry-cli` for release handling
RUN yarn global add @sentry/cli

# Run Sentry release setup if token is provided
RUN if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
    sentry-cli releases finalize "$(sentry-cli releases propose-version)"; \
    fi

# Use a shell to run the command so that environment variables are properly expanded
CMD ["/bin/sh", "-c", "yarn start"]
