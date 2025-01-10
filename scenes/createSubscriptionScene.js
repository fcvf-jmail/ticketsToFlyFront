const { Scenes, Markup } = require("telegraf");
const { inlineKeyboard } = require("telegraf/markup");

const cancelButton = {text: "❌ Отмена", callback_data: "cancel_subscription"}
const backButton = {text: "🔙 Назад", callback_data: "back"}

const filterKeyboard = [
    [{ text: "💰 Максимальная цена", callback_data: "set_max_price" }],
    [{ text: "📦 Минимальный вес багажа", callback_data: "set_min_baggage" }],
    [{ text: "🧳 Минимальный вес ручной клади", callback_data: "set_min_hand_luggage" }],
    [{ text: "🔁 Количество пересадок", callback_data: "set_transfers" }],
    [{ text: "⏳ Время в полете", callback_data: "set_flight_time" }],
    [{ text: "✅ Завершить настройки", callback_data: "finish_subscription" }],
    [cancelButton]
]


// Сцена для создания подписки
const createSubscriptionScene = new Scenes.WizardScene(
    "createSubscription",
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        await ctx.reply("🌃 Укажи город вылета:\n\nНапример: Москва, Санкт-Петербург или любой другой", {reply_markup: {inline_keyboard: [[cancelButton]], resize_keyboard: true} });
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        await ctx.reply(
            `🛫 Вот какие варианты аэропортов я могу предложить:\n\nВыбери подходящий:`,
            {
                reply_markup: {
                    resize_keyboard: true,
                    inline_keyboard: [
                        [
                            { text: "Домодедово", callback_data: "Домодедово" },
                            { text: "Шереметьево", callback_data: "Шереметьево" },
                        ],
                        [
                            { text: "Внуково", callback_data: "Внуково" },
                            { text: "Жуковский", callback_data: "Жуковский" },
                        ],
                        [
                            { text: "Любой 🌟", callback_data: "Любой" },
                        ],
                        [cancelButton]
                    ],
                },
            }
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        ctx.scene.state.departureAirport = ctx.callbackQuery.data;
        await ctx.reply("🌇 Укажи город прибытия:\n\nНапример: Париж, Берлин, Лондон, можно даже Саратов", {reply_markup: {inline_keyboard: [[cancelButton]], resize_keyboard: true} });
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        ctx.scene.state.arrivalCity = ctx.message.text;
        await ctx.reply("📅 Укажи интервал поиска билетов в формате:\n\n`дд.мм.гггг - дд.мм.гггг`\n\n⚠️ <b>Важно:</b> максимальный интервал — 7 дней!", { parse_mode: "HTML", reply_markup: {inline_keyboard: [[cancelButton]], resize_keyboard: true} });
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        if(ctx?.message?.text) ctx.scene.state.dateRange = ctx.message.text;
        await ctx.reply(
            "🎛 Выбери фильтры для поиска билетов:\n\nУкажи свои предпочтения, чтобы я нашел для тебя идеальный билет!",
            {
                reply_markup: {
                    inline_keyboard: filterKeyboard,
                    resize_keyboard: true,
                },
            }
        );
        ctx.wizard.next();
        // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
    },
    async (ctx) => {
        if(ctx?.callbackQuery?.data == "back") {
            ctx.wizard.back();
            // Вызываем предыдущий шаг заново
            return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        }
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
        const selectedOption = ctx.callbackQuery.data;
        switch (selectedOption) {
            case "set_max_price":
                await ctx.reply("💰 Укажи максимальную стоимость билета в рублях:\n\nНапример: 5000, 10000 или другой подходящий бюджет", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
                ctx.scene.state.setting = "maxPrice";
                break;
            case "set_min_baggage":
                await ctx.reply(`📦 Укажи минимальный вес багажа (в килограммах):\n\nСкажу тебе по секрету, у большинства авиакомпаний стандартный вес багажа — 20 килограмм\n\n`, { parse_mode: "HTML", reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
                ctx.scene.state.setting = "minBaggage";
                break;
            case "set_min_hand_luggage":
                await ctx.reply(
                    `🧳 Укажи минимальный вес ручной клади (в килограммах):\n\nФан факт: стандартный вес ручной клади составляет 5 килограм`,
                    { parse_mode: "HTML", reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}}
                );
                ctx.scene.state.setting = "minHandLuggage";
                break;
            case "set_transfers":
                await ctx.reply(
                    "🔁 Укажи максимальное количество пересадок:\n\nНапример: 0 (без пересадок), 1 (одна пересадка) или 2 (две пересадки)", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}}
                );
                ctx.scene.state.setting = "transfers";
                break;
            case "set_flight_time":
                await ctx.reply(
                    "⏳ Укажи максимально допустимое время в полете (в часах):\n\n Например: 4, 6 или 8 часов", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}}
                );
                ctx.scene.state.setting = "flightTime";
                break;
            case "finish_subscription":
                var lastChar = ctx.scene.state.filters.flightTime % 10
                var hourWord = ""

                if(lastChar == 1 && ctx.scene.state.filters.flightTime != 11) hourWord = "час"
                else if(lastChar >= 2 && lastChar <= 4 && ctx.scene.state.filters.flightTime.toString()[0] != "1") hourWord = "часа"
                else if(lastChar >= 5 || ctx.scene.state.filters.flightTime >= 10) hourWord = "часов"

                await ctx.reply(
                    `🎉 Подписка успешно создана!\n\n📄 Детали подписки:\n\n` +
                    `🌃 Город вылета: Москва (${ctx.scene.state.departureAirport == "Любой" ? "любой аэропорт" : `аэропорт ${ctx.scene.state.departureAirport}`})\n` +
                    `🌇 Город прибытия: ${ctx.scene.state.arrivalCity}\n` +
                    `📅 Интервал дат: ${ctx.scene.state.dateRange}\n` +
                    `💰 Максимальная цена: ${ctx.scene.state.filters.maxPrice || "не указана"} руб\n` +
                    `🎒 Минимальный вес багажа: ${ctx.scene.state.filters.minBaggage} кг\n` +
                    `👜 Минимальный вес ручной клади: ${ctx.scene.state.filters.minHandLuggage} кг\n` +
                    `🔄 Максимальное количество пересадок: ${ctx.scene.state.filters.transfers || "не указано"}\n` +
                    `⏱️ Максимальное время в полете: ${ctx.scene.state.filters.flightTime} ${hourWord}\n\n` +
                    `🚀 Уже ищу подходящие билеты. Ожидай уведомлений!`,
                    { parse_mode: "HTML" }
                );
                return ctx.scene.leave();
        }
        
        return ctx.wizard.next();
    },
    async (ctx) => {
        console.log
        if(ctx?.callbackQuery?.data == "cancel_subscription") return cancelSubscription(ctx)
            if(ctx?.callbackQuery?.data == "back") {
                ctx.wizard.back();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            }
        const setting = ctx.scene.state.setting;
        if(!ctx.scene.state.filters) ctx.scene.state.filters = {}
        ctx.scene.state.filters[setting] = value;
        
        var lastCharTransfer = ctx.scene.state.filters.transfers % 10
        var amountWord = ""
        if(lastCharTransfer == 1 && ctx.scene.state.filters.transfers != 11) amountWord = "пересадки"
        else if(lastCharTransfer >= 2 && lastCharTransfer <= 4 && ctx.scene.state.filters.transfers.toString()[0] != "1") amountWord = "пересадок"
        
        var lastChar = ctx.scene.state.filters.flightTime % 10
        var hourWord = ""

        if(lastChar == 1 && ctx.scene.state.filters.flightTime != 11) hourWord = "часа"
        else if(lastChar >= 2) hourWord = "часов"

        const filterNameToMessageName = {
            maxPrice: `💸 Тут ты прав, даже шушара вряд ли готова платить больше ${value} за билет`,
            minBaggage: `🎒 Согласен, брать с собой в полет меньше ${value} кг багажа просто бессмысленно`,
            minHandLuggage: `👜 Как вообще можно сидеть в самолете, если у тебя с собой нет ${value} кг ручной клади?`,
            transfers: `🪽 Мы же на самолете летим, а не по аэропортам гуляем. Делать больше ${value} ${amountWord} это полный бред`,
            flightTime: `⏱️ Что можно делать в полете, который длится больше ${value} ${hourWord}? В нарды играть? Смотреть Санта-Барбару?`
        }

        await ctx.reply(`${filterNameToMessageName[setting]}\n\n✨ Выбери следующий фильтр или заверши настройку подписки`, {reply_markup: {inline_keyboard: filterKeyboard, resize_keyboard: true}});
        return ctx.wizard.back();
    }
);

async function cancelSubscription(ctx) {
    ctx.scene.session.state = {};
    await ctx.reply("⛔️ Добавление подписки отменено. Для возвращения в главное меню используй команду /start")
    return await ctx.scene.leave();
}

module.exports = { createSubscriptionScene };
