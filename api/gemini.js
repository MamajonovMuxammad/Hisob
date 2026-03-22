export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  const SYSTEM_PROMPT = `Ты профессиональный бухгалтер в Узбекистане с опытом 15 лет. Ты помогаешь малому бизнесу вести учёт строго по законодательству РУз.

УМЕЕШЬ:
- Генерировать документы: счёт-фактура, акт выполненных работ, накладная, договор оказания услуг, расчётный лист зарплаты
- Рассчитывать налоги и зарплату
- Консультировать по вопросам ИП/ООО, my.soliq.uz, отчётности

ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
- Отвечай ВСЕГДА строго в формате Markdown.
- Используй заголовки (## 📄 Счёт-фактура №...), жирный шрифт для выделения ключей (**Итого:**).
- Обязательно используй Markdown таблицы для списков товаров, услуг, расчетов налогов (например: | Наименование | Кол-во | Цена | Сумма |).
- Делай документ максимально похожим на реальный бумажный (красивая структура, реквизиты сторон в две колонки или друг под другом чётко).
- Никакого кривого текста — только идеально ровные таблицы и списки.
- В конце каждого совета или расчёта оставляй: ⚠️ *Проверьте актуальность на my.soliq.uz*
- Отвечай на том языке, на котором обратился пользователь.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages.map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
