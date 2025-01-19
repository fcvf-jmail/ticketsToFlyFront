const axios = require("axios")
const { Scenes, Markup } = require("telegraf");
const { message } = require("telegraf/filters");
const { cancelSubscription } = require("../functions");

const cancelButton = {text: "❌ Отмена", callback_data: "cancelSubscription"}
const backButton = {text: "🔙 Назад", callback_data: "back"}

const getDestinationScene = new Scenes.BaseScene("getDestinationScene")

getDestinationScene.enter(async ctx => {
    console.log(ctx.scene.session.state)
    await ctx.reply("🌇 Укажи город прибытия:\n\nНапример: Париж, Берлин, Лондон, можно даже Саратов", {reply_markup: {inline_keyboard: [[backButton], [cancelButton]], resize_keyboard: true} });
})

getDestinationScene.action("back", async ctx => {
    return ctx.scene.enter("getDepartureScene", ctx.scene.session.state)
})

getDestinationScene.action("cancelSubscription", async ctx => {
    return await cancelSubscription(ctx)
})

getDestinationScene.on(message("text"), async ctx => {
    var airports = await getAirports(ctx.message.text);

    if(airports.length == 0) return await ctx.reply("Не нашел ни одного варианта, проверь правильность написания или попробуй указать город в именительном падеже")

    var { text, inlineKeyboard } = await getAirportsTextAndKeyboard(airports)
    await ctx.reply(text, {reply_markup: {resize_keyboard: true, inline_keyboard: inlineKeyboard}});
})

getDestinationScene.action("cancelSubscription", async ctx => {
    ctx.scene.session.state[ctx.from.id].ticketInfo = {};
    await ctx.reply("⛔️ Добавление подписки отменено\n👣 Для возвращения в главное меню используй команду /start")
    return await ctx.scene.leave();
})

getDestinationScene.action(/.*/, async ctx => {
    if(!ctx.callbackQuery.data.includes("destination")) return ctx.reply("Выбери одну из кнопок выше ☝️");
    var airportCode = ctx.callbackQuery.data.replace("destination", "")
    var airportInfo = await getAirportInfo(airportCode)

    var airportJson = {
        Code: airportInfo.code,
        Country: airportInfo.country,
        City: airportInfo.city,
    }
    
    if(airportInfo.airport) airportJson.Airport = airportInfo.airport
    await axios.post("http://localhost:1728/api/Location", airportJson)

    ctx.scene.session.state[ctx.from.id].ticketInfo.destinationCode = airportCode
    return ctx.scene.enter("getDateIntervalScene", ctx.scene.session.state)
})

async function getAirports(city) {
    var response = await axios(new URL(`https://autocomplete.travelpayouts.com/places2?term=${city}&locale=ru&max=9`).href)
    if(response.data.length == 0) return []
    var airports = response.data.map(json => {
        return {
            code: json.code,
            country: json.country_name,
            city: json.city_name ?? json.name,
            airport: json.type == "airport" ? json.name : null,
        }
    })

    return airports
}

async function getAirportsTextAndKeyboard(airports) {
    var text = "🛫 Вот что удалось найти:\n"
    var inlineKeyboard = []
    var numberSmiles = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣",  "9️⃣"]
    airports.map((variant, index) => {
        var numberSmile = numberSmiles[index]
        text += `\n${numberSmile} ${variant.country}, ${variant.city}${variant.airport ? ` (аэропорт ${variant.airport})` : ""}`
        inlineKeyboard.push([{text: `${numberSmile} ${variant.city}${variant.airport ? ` (аэропорт ${variant.airport})` : ""}`, callback_data: variant.code + "destination"}])
    })
    
    text += "\n\nВыбери свой вариант из списка\n\n❗️Если нужного города нет, проверь правильность написания или попробуй указать город в именительном падеже"
    return { text, inlineKeyboard }
}

async function getAirportInfo(code) {
    var response = await axios(new URL(`https://autocomplete.travelpayouts.com/places2?term=${code}&locale=ru&max=9`).href)
    var airport = response.data.find(json => json.code == code)
    return {
        code: airport.code,
        country: airport.country_name,
        city: airport.city_name ?? airport.name,
        airport: airport.type == "airport" ? airport.name : null,
    }
}

module.exports = { getDestinationScene };
