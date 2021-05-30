const { MoneyButtonConfigBuilder } = require('@moneybutton/config')

const config = new MoneyButtonConfigBuilder()
  .build()

module.exports = config
