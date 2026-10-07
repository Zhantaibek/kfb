import { ValidationError } from '../utils/errors.js';

export const methodistService = {
  generate(input: { topic?: string; program?: string }) {
    const program = (input.program ?? '').trim();
    const topic = (input.topic ?? '').trim() || program;
    if (!topic) {
      throw new ValidationError('Укажите тему или выберите курс');
    }

    return {
      title: topic,
      description: [
        `Ситуация. Тема «${topic}»${program && program !== topic ? `, курс «${program}»` : ''}. Нужно принять рабочее решение, а не пересказать лекцию.`,
        '',
        'Что сделать',
        '1. Кратко опишите задачу.',
        '2. Разберите два варианта и последствия каждого.',
        '3. Выберите один и объясните почему. Если решений несколько — так и напишите.',
        '',
        'Что сдать: текст на 1 страницу. Оценивается обоснованность, а не единственный «правильный» ответ.',
      ].join('\n'),
    };
  },
};
