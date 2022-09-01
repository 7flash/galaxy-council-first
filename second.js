import fetch from 'node-fetch';

import TelegramBot from 'node-telegram-bot-api';

import img from 'image-data-uri';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms ?? 1000))

const encodeImage = (url) => {
    return img.encodeFromURL(url, {
    });
}

const Steps = {
    Starting: 1,
    CreateCharacter: 2,
    CreateWorld: 3,
    CreateWorldVoting: 4,
    ChapterOne: 5,
    ChapterOneVoting: 6,
    ChapterTwo: 7,
    ChapterTwoVoting: 8,
    ChapterThree: 9,
    ChapterThreeVoting: 10,
    ChapterFour: 11,
    ChapterFourVoting: 12,
    ChapterFive: 13,
    ChapterFiveVoting: 14,
    Results: 15,
    Evaluation: 16,
}

const token = '5445127737:AAGkBY-LW4cB7t5R6-u7vvU-L6CxMhqiYeA';

const bot = new TelegramBot(token, {polling: true});

bot.on('new_chat_members', (e) => {
    if (e.new_chat_member) {
      const fullName = `${e.new_chat_member.first_name} ${e.new_chat_member.last_name}`;
  
      bot.sendMessage(e.chat.id, `
      Приветствую, прогрессор "${fullName}"! Мировой Совет 👁 одобрил ваше зачисление в данную команду для экспедиций. Вы получили доступ к базовому тренировочному уровню экспедиций.
      
      Я базовый интерфейс Прогрессор v 0.26.2, который поможет вам пройти все этапы путешествия. Для запуска новой экспедиции отправьте любое сообщение. Если вы попали сюда во время осуществления другой экспедиции вы можете подождать следующую в роли наблюдателя. Либо примите участие с другими участниками в текущей. Выбор всегда за вами и да пребудет с вами сила!
    `);
  
      bot.sendPhoto(e.chat.id, 'https://i.ibb.co/7CK7GkP/Slide-7-b.jpg');
  
    }
  });

  const openaiApi = 'https://labs.openai.com/api/labs/tasks'
  const authToken = 'sess-KEjsh2euYnMVvf2z0XXqvrpP5wcssggNa4CmXtc7'

  const getAllPictures = (prompt) => {
    return fetch(`${openaiApi}`, {
        method: "POST",
        body: JSON.stringify({
            task_type: "text2im",
            prompt: {
                caption: prompt + ' - colorful painting in the world of dungeon&dragons',
                batch_size: 4,
            },
        }),
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
        }
    }).then(resp => resp.json())
        .then(async (task) => {
            const { id: taskId } = task;

            while (task.status == "pending") {
                await sleep(2000);

                task = await fetch(`${openaiApi}/${taskId}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                    },
                }).then(resp => resp.json())
            }

            if (task.status == "rejected") throw new Error(task);

            return task.generations.data.map(item => item.generation.image_path);
        })
}

const endpointUrl = 'https://galaxy-db.gosleek.xyz/dev';

const headers = {
    "Content-Type": "application/json",
};

const publishPicture = async (imageDataURL, xn, yn) => {
    const fileId = await fetch(`${endpointUrl}/files`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            dataURL: imageDataURL,
        }),
    }).then(res => res.json()).then(row => row.id);

    const size = 72;

    const response = await fetch(`${endpointUrl}/elements`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            type: "image",
            width: size,
            height: size,
            x: size * xn,
            y: size * yn,
            fileId: fileId,
        })
    }).then(res => res.json())

    console.log(`published ${response.id}`)
}

let chatId;

let currentStep = Steps.Starting;

let users = [];

const responses2 = [
    'Начинаю инициализацию новой экспедиции, подождите...',
    `Аватары для тренировочной экспедиции созданы, перехожу на следующую фазу...`,
    `Проекция мира создана. Все переменные готовы, инициирую старт экспедиции
    3...
    2...
    1...`,
    `Внимание! Стартовый этап экспедиции пройден. Запускаю этап 2...`,
    `Внимание! Этап 2 экспедиции пройден. Запускаю этап 3...`,
    `Внимание! Этап 3 экспедиции пройден. Запускаю этап 4...`,
    `Внимание! Этап 4 экспедиции пройден. Запускаю финальный этап...`,
    `Внимание! Экспедиция завершена, тренировочная симуляция прекращена. Инициирую ретроспективу экспедиции для усовершенствования пользовательского опыта Прогрессора.`,
    `Анализ данных завёршён, благодарю за ваше участие!
    Следующая экспедиция может быть начата не ранее чем через 1 минуту.`
]

const photos = [
    'https://i.ibb.co/X8bCHJC/progressor-char.jpg',
    'https://i.ibb.co/9TNWWx2/progressor-world.jpg',
    'https://i.ibb.co/gFMYFxM/progressor-c1.jpg',
    'https://i.ibb.co/FJJXjd8/progressor-c2.jpg',
    'https://i.ibb.co/MDWNBwv/progressor-c3.jpg',
    'https://i.ibb.co/7J31JGY/progressor-c4.jpg',
    'https://i.ibb.co/tJs6057/progressor-c5.jpg',
    'https://i.ibb.co/Qf0Lknv/progressor-final.jpg',
]

const responses = [
    `
        ВНИМАНИЕ КОМАНДА! Инициирован запуск новой экспедиции, приготовьтесь.
    
        Для старта каждому участнику необходимо сгенерировать аватар для текущей экспедиции.
    
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
        `,
    `
        Прогрессоры! Начинается генерация мира для экспедиции.

        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
        `,
    `
        <b>Глава 1: Пролог.</b> Прогрессоры! Экспедиция начинается, это начальный этап, спланируйте его.
        
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
    `,
    `
        <b>Глава 2. Прогрессоры!</b> Экспедиция продолжается, это второй этап, спланируйте его.
        
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
    `,
    `
        <b>Глава 3. Прогрессоры!</b> Экспедиция продолжается, это третий этап, спланируйте его.
        
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
    `,
    `
        <b>Глава 4. Прогрессоры!</b> Экспедиция продолжается, это четвертый этап, спланируйте его.
        
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
    `,
    `
        <b>Глава 5: Финал.</b> Прогрессоры! Экспедиция подходит к концу, это финальный этап, спланируйте его.
        
        <b>Опишите, как вы его видите</b> <i>[отправьте сообщение одним предложением на любом языке (английский даст более корректный результат) знаки препинания и грамматика/времена не важны]</i>
    `,
    `
        Прогрессоры! <b>Мировой Совет 👁</b> поздравляет вашу команду с успешным завершением тренировочной экспедиции.
        
        Теперь опишите одним предложением ваше состояние и эмоции для оценки прохождения. Система сгенерирует для вас визуальный отпечаток.   
    `,
];
let nextResponseIdx = 0;

const intervalSec = 30;
const timerTick = 5;
const secondTimerTick = 5;
let alreadyBusy = false;

let pinnedMessageId = -1;

const nextPhase = async () => {
    try {
        await bot.unpinAllChatMessages(chatId);

        if (nextResponseIdx >= responses.length) {
            await bot.sendMessage(chatId, responses2[nextResponseIdx]);
            nextResponseIdx = 0;
        }
    
        let secondsRemaining = intervalSec;

        const messageWithTimer = await bot.sendMessage(chatId, `Текущая фаза активирована, пользователи могут присылать сообщения.`, {
            parse_mode: 'HTML'
        });
        pinnedMessageId = messageWithTimer.message_id;

        await bot.pinChatMessage(chatId, pinnedMessageId);

        while (secondsRemaining >= 0) {
            let secondsRemainingText = `${secondsRemaining}`.padStart(2, 0);

            const responseWithTimer = `
                Идёт обработка данных, пользователи могут присылать сообщения.

                <b>00:${secondsRemainingText}</b> ⏱ - время до следующей фазы
            `;
            
            await bot.editMessageText(responseWithTimer, {
                chat_id: chatId,
                message_id: pinnedMessageId,
                parse_mode: 'HTML'
            })
    
            secondsRemaining -= timerTick;

            await sleep(timerTick * 1000);
        }
        
        await bot.sendMessage(chatId, responses2[nextResponseIdx], {
            parse_mode: 'HTML',
        })

        await sleep(secondTimerTick * 1000);

        const nextPicture = photos[nextResponseIdx];

        await bot.sendPhoto(chatId, nextPicture);

        const nextResponse = responses[nextResponseIdx];
    
        await bot.sendMessage(chatId, nextResponse, {
            parse_mode: 'HTML'
        });

        nextResponseIdx++;
        alreadyBusy = false;
        users = [];
    } catch (err) {
        debugger;
    }
}

let xn = 0;
let yn = 0;

bot.on('message', async (e) => {
    if (!chatId)
        chatId = e.chat.id;

    try {
        const authorName = `${e.from.first_name} ${e.from.last_name}`

        const message = e.text;
        const authorId = e.from.id;
        const messageId = e.message_id;

        console.time(messageId);
        console.timeLog(messageId, message);

        if (!message) {
            console.timeLog(messageId, `deleted`);
            await bot.deleteMessage(chatId, e.message_id);
            return;
        }

        if (!alreadyBusy) {
            alreadyBusy = true;
            console.timeLog(messageId, 'new phase');
            setTimeout(() => nextPhase(), 100);
        }

        if (nextResponseIdx == 0) {
            console.timeLog(messageId, 'skip');
            return;
        }

        if (users.includes(authorId)) {
            console.timeLog(messageId, 'already proposed');            
            return;
        } else {
            users.push(authorId);
        }

        console.timeLog(messageId, 'starting in process');

        const pictures = await getAllPictures(message);

        // const pictures = [
        //     `https://i.ibb.co/v3S8Jmc/Screenshot-122.png`,
            // 'https://dog.ceo/api/breeds/image/random'
            // `https://picsum.photos/200`,
            // `https://picsum.photos/200`,
            // `https://picsum.photos/200`,
        // ]

        console.timeLog(messageId, 'getAllPictures done');

        for (const picture of pictures) {
            const pictureData = await encodeImage(picture);
            await publishPicture(pictureData, xn, yn);
            xn++;

            console.timeLog(messageId, `publishPicture done ${xn} ${yn}`);

            // await bot.sendPhoto(chatId, picture, {
            //     reply_to_message_id: messageId,
            // });

            bot.sendMessage(chatId, `<a href="${picture}">${message}</a> - ${authorName}`, {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[{
                        text: '👍',
                        callback_data: 'yes'
                    }]]
                }
            });
    
            console.timeLog(messageId, 'sendPhoto done');
        }

        xn = 0;
        yn++;
    } catch (err) {
        console.error(err)
        // debugger;
        // bot.sendMessage(chatId, err.toString())
    }
})
