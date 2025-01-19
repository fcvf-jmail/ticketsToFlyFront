const cancelButton = {text: "❌ Отмена", callback_data: "cancelSubscription"}
const backButton = {text: "🔙 Назад", callback_data: "back"}
const filterKeyboard = [
    [{ text: "💰 Максимальная цена", callback_data: "setMaxPrice" }],
    [{ text: "📦 Минимальный вес багажа", callback_data: "setMinBaggage" }],
    [{ text: "🧳 Минимальный вес ручной клади", callback_data: "setMinHandBaggage" }],
    [{ text: "🔁 Количество пересадок", callback_data: "setTransfers" }],
    [{ text: "⏳ Время в полете", callback_data: "setFlightTime" }],
    [{ text: "✅ Завершить настройку", callback_data: "finishSubscription" }],
    [cancelButton]
]

const editSubscriptionScene = new Scenes.BaseScene("editSubscriptionScene")

editSubscriptionScene.enter(async ctx => {
    console.log(ctx.scene.session.state)
    console.log(ctx.scene.session.state[ctx.from.id].ticketInfo.filters)
    await ctx.reply("🎛 Выбери фильтры для поиска билетов:\n\nУкажи свои предпочтения, чтобы я нашел для тебя идеальный билет!", { reply_markup: { inline_keyboard: filterKeyboard, resize_keyboard: true }});
})

editSubscriptionScene.action("back", async ctx => {
    return await ctx.scene.enter("editSubscriptionScene", ctx.scene.session.state)
})

editSubscriptionScene.action("cancelSubscription", async ctx => {
    return await cancelSubscription(ctx)
})

editSubscriptionScene.action("setMaxPrice", async ctx => {
    await ctx.reply("💰 Укажи максимальную стоимость билета в рублях:\n\nНапример: 5000, 10000 или другой подходящий бюджет", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
    ctx.scene.session.state[ctx.from.id].ticketInfo.setting = "maxPrice";
})

editSubscriptionScene.action("setMinBaggage", async ctx => {
    await ctx.reply(`📦 Укажи минимальный вес багажа (в килограммах):\n\nСкажу тебе по секрету, у большинства авиакомпаний стандартный вес багажа — 20 килограмм\n\n`, { parse_mode: "HTML", reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
    ctx.scene.session.state[ctx.from.id].ticketInfo.setting = "minBaggage";
})

editSubscriptionScene.action("setMinHandBaggage", async ctx => {
    await ctx.reply(`🧳 Укажи минимальный вес ручной клади (в килограммах):\n\nФан факт: стандартный вес ручной клади составляет 5 килограм`, { parse_mode: "HTML", reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
    ctx.scene.session.state[ctx.from.id].ticketInfo.setting = "minHandBaggage";
})

editSubscriptionScene.action("setTransfers", async ctx => {
    await ctx.reply("🔁 Укажи максимальное количество пересадок:\n\nНапример: 0 (без пересадок), 1 (одна пересадка) или 2 (две пересадки)", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
    ctx.scene.session.state[ctx.from.id].ticketInfo.setting = "transfers";
})

editSubscriptionScene.action("setFlightTime", async ctx => {
    await ctx.reply("⏳ Укажи максимально допустимое время в полете (в часах):\n\n Например: 4, 6 или 8 часов", {reply_markup: {inline_keyboard: [[backButton]], resize_keyboard: true}});
    ctx.scene.session.state[ctx.from.id].ticketInfo.setting = "flightTime";
})

editSubscriptionScene.action("finishSubscription", async ctx => {
    var hourWord = "час"

    if(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.flightTime) {
        var lastChar = ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime % 10
    
        if(lastChar == 1 && ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime != 11) hourWord = "час"
        else if(lastChar >= 2 && lastChar <= 4 && ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime.toString()[0] != "1") hourWord = "часа"
        else if(lastChar >= 5 || ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime >= 10) hourWord = "часов"
    }
    
    var departureAirportString = await getAirportStringByCode(ctx.scene.session.state[ctx.from.id].ticketInfo.departureCode) 
    var destinationAirportString = await getAirportStringByCode(ctx.scene.session.state[ctx.from.id].ticketInfo.destinationCode) 

    await ctx.reply(
        `🎉 Подписка успешно создана!\n\n📄 Детали подписки:\n\n` +
        `🌃 Город вылета: ${departureAirportString}\n` +
        `🌇 Город прибытия: ${destinationAirportString}\n` +
        `📅 Интервал дат: ${ctx.scene.state[ctx.from.id].ticketInfo.dateRange}\n` +
        (ctx.scene.state[ctx.from.id].ticketInfo?.filters?.maxPrice ? `💰 Максимальная цена: ${ctx.scene.state[ctx.from.id].ticketInfo?.filters?.maxPrice} руб\n`: "") +
        (ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minBaggage ? `🎒 Минимальный вес багажа: ${ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minBaggage} кг\n` : "") +
        (ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minHandBaggage ? `👜 Минимальный вес ручной клади: ${ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minHandBaggage} кг\n` : "") +
        (ctx.scene.state[ctx.from.id].ticketInfo?.filters?.transfers ? `🔄 Максимальное количество пересадок: ${ctx.scene.state[ctx.from.id].ticketInfo?.filters?.transfers}\n` : "") +
        (ctx.scene.state[ctx.from.id].ticketInfo?.filters?.flightTime ? `⏱️ Максимальное время в полете: ${ctx.scene.state[ctx.from.id].ticketInfo?.filters?.flightTime} ${hourWord}\n` : "") +
        `\n🚀 Уже ищу подходящие билеты. Ожидай уведомлений!`,
        { parse_mode: "HTML" }
    );
    
    const subscription = {
        ChatId: ctx.from.id.toString(),
        FromDate: ctx.scene.session.state[ctx.from.id].ticketInfo.startDate, 
        ToDate: ctx.scene.session.state[ctx.from.id].ticketInfo.endDate, 
        DepartureCode: ctx.scene.session.state[ctx.from.id].ticketInfo.departureCode, 
        DestinationCode: ctx.scene.session.state[ctx.from.id].ticketInfo.destinationCode, 
        MaxPrice: Number(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.maxPrice),
        MinBaggageWeight: Number(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minBaggage), 
        MinHandBaggageWeight: Number(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.minHandBaggage), 
        MaxTransfersCount: Number(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.transfers), 
        MaxFlightDuration: Number(ctx.scene.state[ctx.from.id].ticketInfo?.filters?.flightTime)
    }

    console.log(subscription)

    await sendSubscriptionToDb(subscription)

    return ctx.scene.leave();
})

editSubscriptionScene.on(message("text"), async ctx => {
    const setting = ctx.scene.session.state[ctx.from.id].ticketInfo.setting;
    if(!ctx.scene.state[ctx.from.id].ticketInfo.filters) ctx.scene.state[ctx.from.id].ticketInfo.filters = {}
    var value = ctx.message.text

    const settingNameToValidateErrorText = {
        maxPrice: "💸 Цена должна быть целым числом. Введи еще раз",
        minBaggage: "🎒 Вес багажа должен быть целым числом. Попробуй ввести снова",
        minHandBaggage: "👜 Вес ручной клади должен быть целым числом. Введи заново",
        transfers: "🪽 Количество пересадок должно быть целым числом. Попробуй еще раз",
        flightTime: "⏱️ Время в полете должно быть целым числом часов. Пожалуйста, введи снова"
    }

    if(!(await stringIsInteger(value))) return await ctx.reply(settingNameToValidateErrorText[setting], {reply_markup: {inline_keyboard: [[backButton]]}})

    ctx.scene.state[ctx.from.id].ticketInfo.filters[setting] = value;

    var amountWord = await getAmountWordForm(ctx)
    var hourWord = await getHourWordForm(ctx)
    
    const filterNameToMessageName = {
        maxPrice: `💸 Тут ты прав, даже шушара вряд ли готова платить больше ${value} за билет`,
        minBaggage: `🎒 Согласен, брать с собой в полет меньше ${value} кг багажа просто бессмысленно`,
        minHandBaggage: `👜 Как вообще можно сидеть в самолете, если у тебя с собой нет ${value} кг ручной клади?`,
        transfers: `🪽 Мы же на самолете летим, а не по аэропортам гуляем. Делать больше ${value} ${amountWord} это полный бред`,
        flightTime: `⏱️ Что можно делать в полете, который длится больше ${value} ${hourWord}? В нарды играть? Смотреть Санта-Барбару?`
    }
    
    await ctx.reply(`${filterNameToMessageName[setting]}\n\n✨ Выбери следующий фильтр или заверши настройку подписки`, {reply_markup: {inline_keyboard: filterKeyboard, resize_keyboard: true}});
})

async function stringIsInteger(str) {
    return /^-?\d+$/.test(str)
}


async function getAmountWordForm(ctx) {
    var lastCharTransfer = ctx.scene.state[ctx.from.id].ticketInfo.filters.transfers % 10
    var amountWord = ""
    if(lastCharTransfer == 1 && ctx.scene.state[ctx.from.id].ticketInfo.filters.transfers != 11) amountWord = "пересадки"
    else if(lastCharTransfer >= 2 && lastCharTransfer <= 4 && ctx.scene.state[ctx.from.id].ticketInfo.filters.transfers.toString()[0] != "1") amountWord = "пересадок"
    return amountWord    
}

async function getHourWordForm(ctx) {
    var lastChar = ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime % 10
    var hourWord = ""
    
    if(lastChar == 1 && ctx.scene.state[ctx.from.id].ticketInfo.filters.flightTime != 11) hourWord = "часа"
    else if(lastChar >= 2) hourWord = "часов"
    return hourWord
}

async function getAirportStringByCode(code) {
    // Запрос к бд по коду
    // Бд возвращает {Id, Code, Country, City, Airport}

    var response = {Country: "франция", City: "стразбург", Airport: "хз какой аэропорт в стразбурге"}

    var country = response.Country
    var city = response.City
    var airport = response.Airport

    var string = `${country}, ${city} (${airport ? airport : "Любой аэропорт"})`

    return string
}

async function sendSubscriptionToDb(subscription) {
    // Запрос к бд по добавлению
    const filteredSubscription = Object.fromEntries( Object.entries(subscription).filter(([_, value]) => value != null && value.toString() != "NaN"));
    console.log(filteredSubscription)
    await axios.post("http://localhost:5000/api/Subscription", filteredSubscription)
}

module.exports = {  }