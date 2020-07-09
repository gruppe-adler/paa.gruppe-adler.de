FROM node:12.7-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV production
RUN npm run build

### STAGE 2: Run ###
FROM steebchen/nginx-spa:stable
COPY --from=build /usr/src/app/dist /app
EXPOSE 80

CMD ["nginx"]