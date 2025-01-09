const path = require(path)
(require("dotenv")).config({path: path.join(__dirname, ".env")})
const { Telegraf, Scenes, session } = require("telegraf");
const { createSubscriptionScene } = require("./scenes/createSubscriptionScene");
const bot = new Telegraf(process.env.botToken);

const stage = new Scenes.Stage([createSubscriptionScene])
bot.use(session());
bot.use(stage.middleware())

// Главная сцена с кнопками
bot.start((ctx) => {
    ctx.reply(`👋 Привет, ${ctx.from.first_name}!\n\n🔍 Устал тратить время на бесконечный поиск дешевых авиабилетов? Я здесь, чтобы сделать это за тебя!\n\n🎯 Нажми на кнопку ниже и начни свой путь к идеальному путешествию прямо сейчас!`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✈️ Создать новую подписку", callback_data: "createSubscription" }],
                    [{ text: "⚙️ Управлять подписками", callback_data: "manageSubscriptions" }],
                ],
            },
        }
    );
});

// Роутинг кнопки создания подписки
bot.action("createSubscription", (ctx) => {
    ctx.scene.enter("createSubscription");
});

// Роутинг кнопки управления подписками (заглушка)
bot.action("manageSubscriptions", (ctx) => {
    ctx.reply("Раздел управления подписками еще в разработке. Подписки можно создавать прямо сейчас!");
});

// Запуск бота
bot.launch();
console.log("Бот запущен!");