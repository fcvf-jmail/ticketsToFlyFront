const axios = require("axios")
const { Scenes, Markup } = require("telegraf");
const { message } = require("telegraf/filters");
const { cancelSubscription } = require("../functions");

const backButton = {text: "🔙 Назад", callback_data: "back"}
const cancelButton = {text: "❌ Отмена", callback_data: "cancelSubscription"}

const getDateIntervalScene = new Scenes.BaseScene("getDateIntervalScene")

getDateIntervalScene.enter(async ctx => {
    console.log(ctx.scene.session.state)
    await ctx.reply("📅 Укажи интервал поиска билетов в формате:\n\nдд.мм.гггг - дд.мм.гггг\n\n⚠️ <b>Важно:</b> максимальный интервал — 7 дней!", { parse_mode: "HTML", reply_markup: {inline_keyboard: [[backButton], [cancelButton]], resize_keyboard: true} });
})

getDateIntervalScene.action("cancelSubscription", async ctx => {
    return await cancelSubscription(ctx)
})

getDateIntervalScene.action("back", async ctx => {
    return ctx.scene.enter("getDestinationScene", ctx.scene.session.state)
})

getDateIntervalScene.on(message("text"), async ctx => {
    const { startDateString, endDateString, errorMessage } = await validateDate(ctx.message.text)
    if(errorMessage) return await ctx.reply(errorMessage)

    ctx.scene.session.state[ctx.from.id].ticketInfo.startDate = startDateString
    ctx.scene.session.state[ctx.from.id].ticketInfo.endDate = endDateString

    ctx.scene.state[ctx.from.id].ticketInfo.dateRange = ctx.message.text
    
    console.log(ctx.scene.session.state[ctx.from.id].ticketInfo)
    return ctx.scene.enter("getFiltersScene", ctx.scene.session.state)
})

async function validateDate(dateString) {
    var writeNewDateText = "📅 Укажи новый интервал поиска в формате:\n\n`дд.мм.гггг - дд.мм.гггг`"

    const regex = /^(\d{2})\.(\d{2})\.(\d{4}) - (\d{2})\.(\d{2})\.(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) return { errorMessage: `⚠️ Некорректный формат\n\n${writeNewDateText}` }

    const startDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
    const endDate = new Date(`${match[6]}-${match[5]}-${match[4]}`);

    console.log(startDate)
    console.log(endDate)

    const startDateString = match.input.split(" - ")[0]
    const endDateString = match.input.split(" - ")[1]

    if(startDate.toString() == "Invalid Date") return { errorMessage: `⚠️ ${match.input.split(" - ")[0]} - такой даты не существует\n\n${writeNewDateText}` }
    if(endDate.toString() == "Invalid Date") return { errorMessage: `⚠️ ${match.input.split(" - ")[1]} - такой даты не существует\n\n${writeNewDateText}` }

    const today = new Date()
    today.setHours(0)
    today.setMinutes(0)
    today.setMilliseconds(0)

    if(startDate < today) return { errorMessage: `⚠️ Дата не может быть раньше сегодняшнего дня\n\n${writeNewDateText}` }

    var endDateIsFurtherThenOneYear = ((endDate - today) / (1000 * 3600 * 24)) > 365
    if(endDateIsFurtherThenOneYear) return { errorMessage: `⚠️ Нельзя выбрать дату, которая больше чем на год позже сегодняшней\n\n${writeNewDateText}` }

    const diffTime = endDate - startDate;
    const diffDays = diffTime / (1000 * 3600 * 24);

    console.log(diffDays)

    if (diffDays < 0) return { errorMessage: `⚠️ Начальная дата должна быть раньше или совпадать с конечной\n\n${writeNewDateText}` }
    if (diffDays > 7) return { errorMessage: `⚠️ Максимальный интервал — 7 дней. Пожалуйста, введите корректный интервал\n\n${writeNewDateText}` }

    return { startDateString, endDateString }
}

module.exports = { getDateIntervalScene }