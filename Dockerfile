# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm install
COPY dashboard/ ./dashboard/
RUN cd dashboard && npm run build

# Final stage
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt flask flask-cors pyjwt bcrypt google-genai
COPY . .
COPY --from=build /app/dashboard/dist ./dashboard/dist

EXPOSE 5000
CMD ["python", "dashboard_api.py"]
