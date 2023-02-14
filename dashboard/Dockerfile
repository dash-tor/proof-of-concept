# STAGE 1: build angular frontend
FROM node:lts-alpine AS build
WORKDIR /dashboard-frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend .
RUN npm run build

# STAGE 2: copy build to webserver
FROM python:3.10-alpine
# install dependencies
COPY backend/requirements.txt /requirements.txt
RUN pip install -r requirements.txt
# copy frontend files
COPY --from=build /dashboard-frontend/dist/dashboard /static
# copy python-server file
COPY backend/backend_server.py /backend_server.py
ENTRYPOINT python3 -u backend_server.py
