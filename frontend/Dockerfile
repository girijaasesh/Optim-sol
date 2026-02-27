FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration=production 2>&1 || (cat /tmp/ng-error.log 2>/dev/null; exit 1)

FROM nginx:alpine
COPY --from=build /app/dist/agilepro-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
