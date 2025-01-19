const axios = require("axios")
const { Scenes, Markup } = require("telegraf");
const { message } = require("telegraf/filters");
const { cancelSubscription } = require("../functions");


const cancelButton = { text: "❌ Отмена", callback_data: "cancelSubscription" }

const getDepartureScene = new Scenes.BaseScene("getDepartureScene")
getDepartureScene.enter(async ctx => {
    ctx.scene.session.state[ctx.from.id] = { ticketInfo: {} }
    await ctx.reply("🌃 Укажи город вылета:\n\nНапример: Москва, Санкт-Петербург или любой другой", {reply_markup: {inline_keyboard: [[cancelButton]], resize_keyboard: true} });
})


getDepartureScene.on(message("text"), async ctx => {
    var airports = await getAirports(ctx.message.text);

    if(airports.length == 0) return await ctx.reply("Не нашел ни одного варианта, проверь правильность написания или попробуй указать город в именительном падеже")

    var { text, inlineKeyboard } = await getAirportsTextAndKeyboard(airports)
    await ctx.reply(text, {reply_markup: {resize_keyboard: true, inline_keyboard: inlineKeyboard}});
})

getDepartureScene.action("cancelSubscription", async ctx => {
    return await cancelSubscription(ctx)
})

getDepartureScene.action(/.*/, async ctx => {
    if(!ctx.callbackQuery.data.includes("departure")) return ctx.reply("Выбери одну из кнопок выше ☝️");
    var airportCode = ctx.callbackQuery.data.replace("departure", "")
    var airportInfo = await getAirportInfo(airportCode)

    var airportJson = {
        Code: airportInfo.code,
        Country: airportInfo.country,
        City: airportInfo.city,
    }

    console.log(airportInfo)
    console.log(airportJson)
    
    if(airportInfo.airport) airportJson.Airport = airportInfo.airport
    await axios.post("http://localhost:1728/api/Location", airportJson)

    ctx.scene.session.state[ctx.from.id].ticketInfo.departureCode = airportCode
    return ctx.scene.enter("getDestinationScene", ctx.scene.session.state)
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
        inlineKeyboard.push([{text: `${numberSmile} ${variant.city}${variant.airport ? ` (аэропорт ${variant.airport})` : ""}`, callback_data: variant.code + "departure"}])
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

module.exports = { getDepartureScene };
