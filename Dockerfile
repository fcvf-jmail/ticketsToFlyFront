# Используем официальный образ Node.js
FROM node:20-slim

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы проекта в контейнер
COPY . .

# Команда для запуска бота
CMD ["node", "ticketsToSkyFront.js"]