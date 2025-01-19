async function cancelSubscription(ctx) {
    ctx.scene.session.state = {};
    await ctx.reply("⛔️ Добавление подписки отменено\n👣Для возвращения в главное меню используй команду /start")
    return await ctx.scene.leave();
}

module.exports = { cancelSubscription }