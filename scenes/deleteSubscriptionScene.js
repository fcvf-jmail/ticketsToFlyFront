const { default: axios } = require("axios");
const { Scenes } = require("telegraf");

cancelButton = {text: "❌ Отмена", callback_data: "cancelDeleting"}

const deleteSubscriptionScene = new Scenes.BaseScene("deleteSubscriptionScene")

deleteSubscriptionScene.enter(async ctx => {
    var inlineKeyboard = [];
    const subscriptions = await (await axios.get(`http://localhost:1728/api/Subscription/User/${ctx.from.id}`)).data
    
    if(subscriptions.length == 0) return await ctx.reply("🧐 У вас нет не создано ни одной подписки", {reply_markup: {inline_keyboard: [[{text: "➕ Создать подписку", callback_data: "createSubscription"}], [cancelButton]]}})
    ctx.scene.session.state[ctx.from.id] = {subscriptions}
    console.log(subscriptions)
    subscriptions.forEach((subscription, index) => {
        var text = subscription.departureLocation.city
        if(subscription.departureLocation.airport) text += ` (${subscription.departureLocation.airport})`
        
        text += ` - ${subscription.destinationLocation.city}`
        if(subscription.destinationLocation.airport) text += ` (${subscription.departureLocation.airport})`

        inlineKeyboard.push([{text, callback_data: `subscription ${subscription.id}`}])
    });

    inlineKeyboard.push([cancelButton])

    ctx.reply("Выбери подписку, которую хочешь удалить", {reply_markup: {inline_keyboard: inlineKeyboard}})
})

deleteSubscriptionScene.action("cancelDeleting", async ctx => {
    await ctx.reply("⛔️ Удаление подписки отменено\n👣 Для возвращения в главное меню используй команду /start")
    ctx.scene.leave()
})

deleteSubscriptionScene.action(/subscription /ig, async ctx => {
    const subscriptionId = ctx.callbackQuery.data.replace("subscription ", "")
    const subscription = ctx.scene.session.state[ctx.from.id].subscriptions.find(subscription => subscription.id == subscriptionId);

    const startDate = new Date(subscription.fromDate)
    const endDate = new Date(subscription.toDate)
    
    const startDateString = startDate.toLocaleString("ru-Ru", {day: "2-digit", month: "2-digit", year: "numeric"})
    const endDateString = endDate.toLocaleString("ru-Ru", {day: "2-digit", month: "2-digit", year: "numeric"})

    var dateRange = `${startDateString} - ${endDateString}`

    var hourWord = "час"

    if(subscription?.maxFlightDuration) {
        var lastChar = subscription.maxFlightDuration % 10
    
        if(lastChar == 1 && subscription.maxFlightDuration != 11) hourWord = "час"
        else if(lastChar >= 2 && lastChar <= 4 && subscription.maxFlightDuration.toString()[0] != "1") hourWord = "часа"
        else if(lastChar >= 5 || subscription.maxFlightDuration >= 10) hourWord = "часов"
    }

    await ctx.reply(
        `📄 Детали подписки:\n\n` +
        `🌃 Город вылета: ${subscription.departureLocation.city}${subscription.departureLocation.airport ? ` (${subscription.departureLocation.airport})` : ""}\n` +
        `🌇 Город прибытия: ${subscription.destinationLocation.city}${subscription.destinationLocation.airport ? ` (${subscription.destinationLocation.airport})` : ""}\n` +
        `📅 Интервал дат: ${dateRange}\n` +
        (subscription.maxPrice ? `💰 Максимальная цена: ${subscription.maxPrice} руб\n`: "") +
        (subscription.minBaggageWeight ? `🎒 Минимальный вес багажа: ${subscription.minBaggageWeight} кг\n` : "") +
        (subscription.minHandBaggageWeight ? `👜 Минимальный вес ручной клади: ${subscription.minHandBaggageWeight} кг\n` : "") +
        (subscription.maxTransfersCount ? `🔄 Максимальное количество пересадок: ${subscription.maxTransfersCount}\n` : "") +
        (subscription.maxFlightDuration ? `⏱️ Максимальное время в полете: ${subscription.maxFlightDuration} ${hourWord}\n` : "") +
        `\nУдалить подписку?`,
        { parse_mode: "HTML", reply_markup: {inline_keyboard: [[{text: "Да", callback_data: `delete ${subscriptionId}`}], [{text: "🔙 Назад", callback_data: "backToSubscriptionChoise"}]]}}
    );
})

deleteSubscriptionScene.action("backToSubscriptionChoise", ctx => ctx.scene.enter("deleteSubscriptionScene"))

deleteSubscriptionScene.action(/delete /ig, async ctx => {
    var subscriptionId = ctx.callbackQuery.data.replace("delete ", "")
    await axios.delete(`http://localhost:1728/api/Subscription/${subscriptionId}`)
    return await ctx.reply("Подписка успешно удалена", {reply_markup: {inline_keyboard: [[{text: "🔙 Назад", callback_data: "backToSubscriptionChoise"}]]}})
})

module.exports = { deleteSubscriptionScene }