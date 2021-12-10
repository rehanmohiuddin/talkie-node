const { gTranslate } = require("../config/translate");

const translate = async (req, res) => {
  try {
    const { content, targetLang } = req.body;
    const [translation] = await gTranslate.translate(content, targetLang);
    res.status(200).send({
      translatedContent: translation,
      originalContent: content,
    });
  } catch (error) {
    res.status(500).send({
      error: error,
    });
  }
};

module.exports = {
  translate: translate,
};
