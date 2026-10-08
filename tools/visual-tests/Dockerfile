FROM mcr.microsoft.com/playwright:v1.53.1-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source (snapshot dirs are volume-mounted at runtime)
COPY . .

# Run through sh: tools/visual-tests is bind-mounted at runtime, so the exec bit may not survive.
ENTRYPOINT ["sh", "./tools/visual-tests/docker-entrypoint.sh"]
CMD ["npx", "playwright", "test", "--config=tools/visual-tests/playwright.config.ts"]
