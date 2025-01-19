const path = require("path")
require("dotenv").config({path: path.join(__dirname, ".env")})
const { Telegraf, Scenes, session } = require("telegraf");
const bot = new Telegraf(process.env.botToken);

const { getDepartureScene } = require("./scenes/getDepartureScene");
const { getDestinationScene } = require("./scenes/getDestinationScene");
const { getDateIntervalScene } = require("./scenes/getDateIntervalScene");
const { getFiltersScene } = require("./scenes/getFiltersScene");
const { default: axios } = require("axios");
const { deleteSubscriptionScene } = require("./scenes/deleteSubscriptionScene");

const stage = new Scenes.Stage([getDepartureScene, getDestinationScene, getDateIntervalScene, getFiltersScene, deleteSubscriptionScene])
bot.use(session());
bot.use(stage.middleware())

// Главная сцена с кнопками
bot.start(async ctx => {
    await axios.post("http://localhost:1728/api/User", {
        ChatId: ctx.from.id.toString(),
        Username: ctx.from?.username,
        FirstName: ctx.from.first_name.toString(),
        LastName: ctx.from?.last_name
    })
    await ctx.reply(`👋 Привет, ${ctx.from.first_name}!\n\n🔍 Устал тратить время на бесконечный поиск дешевых авиабилетов? Я здесь, чтобы сделать это за тебя!\n\n🎯 Нажми на кнопку ниже и начни свой путь к идеальному путешествию прямо сейчас!`, {reply_markup: {inline_keyboard: [[{ text: "✈️ Создать новую подписку", callback_data: "createSubscription" }], [{ text: "🗑 Удалить подписку", callback_data: "deleteSubscription" }]]}});
});

// Роутинг кнопки создания подписки
bot.action("createSubscription", (ctx) => {
    ctx.scene.enter("getDepartureScene");
});

// Роутинг кнопки управления подписками (заглушка)
bot.action("deleteSubscription", (ctx) => {
    ctx.scene.enter("deleteSubscriptionScene");
});

// Запуск бота
bot.launch();
console.log("Бот запущен!");