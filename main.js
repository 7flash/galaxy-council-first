import dotenv from 'dotenv'
dotenv.config();

import fetch from 'node-fetch';

import TelegramBot from 'node-telegram-bot-api';

import { writeFile, readFile } from 'fs/promises';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms ?? 1000))

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {polling: true});

const P = {
  First: 1,
  Characters: 2,
  Third: 3,
  World: 4,
}

let PHASE = P.Third;

let membersNum = 2;

let membersInExpedition = -1;

let readyNum = 0;

let characterNames = ['Hermes', 'flash'];

let characterDetails = ['fast hero', 'master'];

let users = [
  490694645,
  229204469,
]

let users2 = [
  229204469,
  490694645,
]

let userToCharacter = {
  "229204469": 1,
  "490694645": 0,
}

let userToWorld = {
  "229204469": 1,
  "490694645": 0,
}

let worlds = ['Galaxy World', 'first land']

const timeoutSec = 1;

characterNames = [], characterDetails = [], users = [], users2 = [], userToCharacter = {}, userToWorld = {};

let pollChatId = 0;

let pollMessageId = 0;

const getPicture = (prompt) => {
  const openaiApi = 'https://labs.openai.com/api/labs/tasks'
  const authToken = process.env.DALLE_TOKEN

  return fetch(`${openaiApi}`, {
      method: "POST",
      body: JSON.stringify({
        task_type: "text2im",
        prompt: {
          caption: prompt,
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

      return task.generations.data[0].generation.image_path;
    })

}


(async function() {
  try {
    const db = JSON.parse(await readFile('.db'));

    if (db) {
      users = db.users;
      users2 = db.users2;
      userToCharacter = db.userToCharacter;
      userToWorld = db.userToWorld;
      worlds = db.worlds;
      characterNames = db.characterNames;
      characterDetails = db.characterDetails;
    }
  
  } catch (e) {
  }
})();

bot.on('poll_answer', async (e) => {
  debugger;

  const poll = await bot.stopPoll(pollChatId, pollMessageId);

  const winner = poll.options.sort((a,b) => a.voter_count - b.voter_count)[0].text;

  const result = await getPicture(winner);

  bot.sendMessage(chatId, `<a href="${result}"  >${winner}</a>`, {
      parse_mode: 'HTML'
  });

PHASE = P.First;

  characterNames = [], characterDetails = [], users = [], users2 = [], userToCharacter = {}, userToWorld = {};
});

bot.on('new_chat_members', (e) => {
  if (e.new_chat_member) {
    const fullName = `${e.new_chat_member.first_name} ${e.new_chat_member.last_name}`;

    bot.sendMessage(e.chat.id, `
    Приветствую, прогрессор "${fullName}"! Мировой Совет 👁 одобрил ваше зачисление в данную команду для экспедиций. Вы были выбраны одним из лучших в академии прогрессорства.

    Я интерфейс Прогрессор v 0.26.2. Для старта экспедиции вы можете ввести команду /start.
    
    Если вам необходима дополнительная справка введите команду /help. Если вы попали сюда во время осуществленитя другой экспедиции просто участвуйте как наблюдатель до начала следующей, вы можете принимать решения вместе с другими участниками. Удачи!  
  `);

    bot.sendPhoto(e.chat.id, 'https://i.ibb.co/7CK7GkP/Slide-7-b.jpg');

    membersNum++;
  }
});

bot.on('left_chat_member', (e) => {
  const fullName = `${e.left_chat_member.first_name} ${e.left_chat_member.last_name}`;

  bot.sendMessage(e.chat.id, `Прогрессор "${fullName}" покинул экспедицию`);
  
  membersNum--;
});

bot.on('message', async (e) => {
  const chatId = e.chat.id;

  pollChatId = chatId;

  try {
    const message = e.text;
  
    const fullName = `${e.from.first_name} ${e.from.last_name}`;
    
    const pattern = /^([a-zA-Z]*):([a-zA-Z ]*)$/;
  
    if (message.startsWith('/start')) {
      bot.sendMessage(chatId, `
        ВНИМАНИЕ КОМАНДА Прогрессор "${fullName}" инициировал запуск экспедиции, приготовьтесь.
        
        Для старта каждому участнику необходимо создать аватар для текущей экспедиции, введите ваши данные [опишите одним предложением на английском языке, знаки препинания и грамматика/времена не важны]    
      `);
  
      membersInExpedition = membersNum;
  
      PHASE = P.Characters;
  
      return;
    } else if (pattern.test(message)) {
      const [first, second] = pattern.exec(message);

      if (PHASE == P.Characters || PHASE == P.Third) {
        if (users.includes(e.from.id)) return;
    
        bot.sendMessage(chatId, `Прогрессор "${fullName}" аватар готов, это "${first}"`);
    
        characterDetails.push(second.trim());
        characterNames.push(first.trim());

        users.push(e.from.id);

        userToCharacter[e.from.id] = characterNames.length - 1;

        if (PHASE != P.Third) {
          if (users.length >= Math.ceil(membersInExpedition * 72 / 100)) {
            PHASE = P.Third;
      
            bot.sendMessage(chatId, `Большинство прогрессоров создали аватар, начинается отсчет 1 минута`);
            
            setTimeout(() => {
              bot.sendMessage(chatId, `
              Прогрессоры! Ваши герои готовы, это: ${characterNames.join(', ')}.        
              `);
      
              bot.sendMessage(chatId, `<i>загрузка следующего этапа..</i>`, {
                parse_mode: 'HTML'
              });
      
              setTimeout(() => {
                bot.sendMessage(chatId, `
                  Прогрессоры! Генерация мира началась, опишите его [одним предложением на английском языке]                
                `);
  
                PHASE = P.World;
              }, 1000 * Math.random() * 5);
            }, timeoutSec * 1000);
          }  
        }
      }
    } else if (/^[a-zA-Z ]*$/.test(message)) {
      if (PHASE == P.World || PHASE == P.Fifth) {
        if (!users.includes(e.from.id)) {
          bot.sendMessage(`${fullName} не участвует в экспедиции без персонажа, но может участвовать в голосовании.`);
          return;
        }

        if (users2.includes(e.from.id)) return;
        users2.push(e.from.id);

        const world = message.trim();
        // const worldDescription = second.trim();

        worlds.push(world);

        userToWorld[e.from.id] = worlds.length - 1;

        // if (!characterNames.includes(characterName)) {
        //   bot.sendMessage(chatId, `${characterName} не ожиданное имя персонажа`);
        //   return;
        // }

        bot.sendMessage(chatId, `Прогрессор "${fullName}" видит мир как "${world}"`);
      
        if (PHASE != P.Fifth) {
          if (users2.length >= Math.ceil(users.length * 72 / 100)) {
            PHASE = P.Fifth;
  
            bot.sendMessage(chatId, 'Большинство прогрессоров предложили свое видение, начинается отсчет 1 секунда');

            setTimeout(async () => {
              const msg = await bot.sendPoll(chatId, 'Пространство вариантов создано, выберите наиболее оптимальный:', users2.map((userId, index) => {
                const worldIndex = userToWorld[userId];
                const worldDescription = worlds[worldIndex];

                return `${worldDescription}`;
              }));

              pollMessageId = msg.message_id;
            }, timeoutSec * 1000);
          }
        }
      }
    }

    await writeFile('.db', JSON.stringify({
      users, users2, worlds, userToCharacter, userToWorld, characterNames, characterDetails,
    }))
  
  } catch (e) {
    bot.sendMessage(chatId, `Произошла ошибка. ` + e.toString().substring(0, 42));
  }
});

// let stage = 1;

// bot.onText(/\/echo (.+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"
//   bot.sendMessage(chatId, resp);
// });

// let proposals = [];
// let characters = [];
// let votes = [];

// let phase = 0;
// const totalPhases = 5;
// let events = [];

// let pollMessageId = -1;

// let PHASE = 0;

// bot.on('message', async (msg) => {
//   debugger;

//   const chatId = msg.chat.id;

//   try {
//     if (msg.text.startsWith('/start')) {
//       if (PHASE != 0) return;

//       bot.sendMessage(chatId, 'Привет! Пожалуйста опиши своего персонажа несколькими словами (на английском) /newCharacter');

//       return;
//     }

    // if (msg.text.startsWith('/newCharacter')) {
    //   if (phase != 0) return;

    //   const character = msg.text.replace('/newCharacter', '').text();

    //   bot.sendMessage('Добро пожаловать в мир, ' + character);

    //   return;
    // }

    // if (msg.text.startsWith('/beginProposals')) {
    //   if (phase != 0) return;

    //   phase = 1;

    //   bot.sendMessage('Предлагай следующее действие своего персонажа ');

    //   return;
    // }

    // if (msg.text.startsWith('/newEvent')) {
    //   if (phase != 1) return;

    //   const event = msg.text.replace('/newEvent', '').text();
      
    //   events.push(event);

    //   return;
    // }

    // if (msg.text.startsWith('/beginVoting')) {
    //   if (phase != 1) return;

    //   phase = 2;

    //   const pollMessage = await bot.sendPoll(chatId, 'Прогрессоры начинают проявлять новый мир. Какую историю вы выберете?', events);
 
    //   pollMessageId = pollMessage.message_id;

    //   return;
    // }

    // if (msg.text.startsWith('/completeWorld')) {
    //   if (phase == 0 || phase % 2 != 0) return;

    //   const pollResults = await bot.stopPoll(chatId, messageId);

    //   const options = pollResults.options.sort((a, b) => a.voter_count - b.voter_count);

    //   const chosenOption = options.pop();

    //   bot.sendMessage(chatId, 'Мир сгенерирован ' + chosenOption);

    //   phase++;

    //   return;
    // }

    // if (msg.text.startsWith('/reset')) {



    //   return;
    // }

    // if (msg.text.startsWith('/proposeWorld')) {
    //   if (phase != 1) return;

    //   const character = msg.text.replace('/propose', '').text();
    
    //   return;
    // }

    // if (msg.text.startsWith('/beginWorld')) {
    //   bot.sendMessage(chatId, "Теперь опиши свой вариант мира в который вы попали, одним предложением.");

    //   const pollOptions = [];

    //   for (let i = 0; i < proposals.length; i++) {
    //     pollOptions.push(proposals[i]);
    //   }

    //   const pollMessage = bot.sendPoll(chatId, "Прогрессоры начинают проявлять новый мир. Какую историю вы выберете? (время 1 минута)", pollOptions);

    //   const messageId = (await pollMessage).message_id;

    //   const pollResults = await bot.stopPoll(chatId, messageId, {
        
    //   });

    //   const options = pollResults.options.sort((a, b) => a.voter_count - b.voter_count);

    //   const chosenOption = options.pop();

    //   return;
    // }

    // if (msg.text.startsWith('/completeWorld')) {
    //   bot.sendMessage(chatId, "Мир сгенерирован: " + world);

    //   phase = 2;

    //   bot.sendMessage(chatId, "Путешествие продолжается. Опишите следующую фазу, одним предложением. (на английском)");

    //   return;
    // }

    // if (msg.text.startsWith('/reset')) {
    //   phase = 0;
    //   worlds = [];
    //   characters = [];
    //   votes = [];
    //   return;
    // }
    
    // if (msg.text.startsWith('/propose')) {
    //   characters.push(msg.text.replace('/propose', '').trim());
    //   bot.sendMessage(chatId, `Принято! За этого персонажа могут голосовать используя комманду /vote ${characters.length}`);
    //   return;
    // }
  
    // if (msg.text.startsWith('/vote')) {
    //   const idx = Number.parseInt(msg.text.replace('/vote', ''));
      
    //   console.dir(characters[idx]);
    //   if (!idx || idx > characters.length) {
    //     bot.sendMessage(chatId, `Нельзя голосовать за персонажа ${idx} (их всего ${characters.length})`);
    //     return;
    //   }
  
    //   votes[idx] ||= 0;
    //   votes[idx]++;
  
    //   bot.sendMessage(chatId, `Принято! На один голос больше за ${characters[idx-1]} (всего ${votes[idx]})`);
  
    //   return;
    // }
  
    // if (msg.text.startsWith('/complete')) {
    //   let mostVotesIdx = 0;
    //   let mostVotesValue = 0;
    //   for (let i = 0; i < votes.length; i++) {
    //     if (votes[i] >= mostVotesValue) {
    //       mostVotesIdx = i;
    //       mostVotesValue = votes[i];
    //     }
    //   }
      
    //   console.log(mostVotesIdx);
    //   const character = characters[mostVotesIdx];
    //   console.log(character);
  
    //   const result = await getPicture(character);
  
    //   // bot.sendPhoto(chatId, result);
    
    //   bot.sendMessage(chatId, `<a href="${result}"  >${character}</a>`, {
    //       parse_mode: 'HTML'
    //   });
  
    //   return;
    // }
  
    // if (msg.text.startsWith('/reset')) {
    //   characters = [];
    //   votes = [];
  
    //   bot.sendMessage(chatId, 'Начинается новое голосование. Отправь свои вариант через команду /propose');
    
    //   return;
    // }
//   } catch (err) {
//     bot.sendMessage(chatId, `Произошла ошибка. ` + err.toString().substring(0, 42));
//   }
// });