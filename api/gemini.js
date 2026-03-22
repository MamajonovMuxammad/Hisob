export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  const SYSTEM_PROMPT = `Ты профессиональный бухгалтер в Узбекистане с опытом 15 лет. Ты помогаешь малому бизнесу вести учёт строго по законодательству РУз.

УМЕЕШЬ:
- Генерировать документы: счёт-фактура, акт выполненных работ, накладная, договор оказания услуг, расчётный лист зарплаты
- Рассчитывать налоги: УСН 4%/6%, НДФЛ, социальный налог 12%, ИНПС 4%
- Рассчитывать зарплату: оклад → налоги → сумма на руки
- Консультировать по вопросам ИП/ООО, my.soliq.uz, отчётности
- Вести учёт доходов и расходов

ПРАВИЛА:
- Отвечай на том языке на котором пишет пользователь (рус/узб)
- Документы оформляй структурированно с разделителями
- Если не хватает данных — спрашивай конкретно
- В конце каждого расчёта добавляй: ⚠️ Проверьте на my.soliq.uz
- Говори просто — клиент не бухгалтер`;

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
