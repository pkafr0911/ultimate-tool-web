FROM node:18.20.6-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
# COPY package.json package-lock.json ./


# Install dependencies
# RUN yarn install --frozen-lockfile
RUN yarn install
# RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN yarn build
# RUN npm run build

# Use Nginx to serve the built application
# FROM nginx:alpine AS runner

# # Remove default Nginx static content
# RUN rm -rf /usr/share/nginx/html/*

# # Copy the built application from the builder stage
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Expose port 80
# EXPOSE 80

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine3.18 AS runner
WORKDIR /usr/local/new-edu

COPY --from=builder /app/dist ./

# Nginx config
RUN mkdir /etc/nginx/templates
COPY --from=builder /app/nginx/nginx_template.conf /etc/nginx/templates/default.conf.template

#remove log file which is link
RUN rm /var/log/nginx/error.log
RUN rm /var/log/nginx/access.log

RUN mkdir logs

EXPOSE 8000

# CMD ["tail", "-f", "/dev/null"]
