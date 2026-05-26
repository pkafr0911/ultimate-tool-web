FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies with frozen lockfile for reproducibility
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN yarn build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
WORKDIR /usr/local/ultimate-tool-web

COPY --from=builder /app/dist ./

# Nginx config
RUN mkdir -p /etc/nginx/templates
COPY --from=builder /app/nginx/nginx_template.conf /etc/nginx/templates/default.conf.template

# Remove default symlink log files and create real log directory
RUN rm -f /var/log/nginx/error.log /var/log/nginx/access.log
RUN mkdir -p logs

EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
