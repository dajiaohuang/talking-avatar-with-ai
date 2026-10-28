import fs from "fs";
import os from "os";
import path from "path";
import { convertTextToSpeech } from "./elevenLabs.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";

const MAX_RETRIES = 10;
const RETRY_DELAY = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lipSync = async ({ messages }) => {
  const audioDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "talking-avatar-lipsync-"));

  try {
    await Promise.all(
      messages.map(async (message, index) => {
        const fileName = path.join(audioDir, `message_${index}.mp3`);

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            await convertTextToSpeech({ text: message.text, fileName });
            await delay(RETRY_DELAY);
            break;
          } catch (error) {
            if (error.response && error.response.status === 429 && attempt < MAX_RETRIES - 1) {
              await delay(RETRY_DELAY);
            } else {
              throw error;
            }
          }
        }
        console.log(`Message ${index} converted to speech`);
      })
    );

    await Promise.all(
      messages.map(async (message, index) => {
        const fileName = path.join(audioDir, `message_${index}.mp3`);

        try {
          await getPhonemes({ message: index, audioDir });
          message.audio = await audioFileToBase64({ fileName });
          message.lipsync = await readJsonTranscript({ fileName: path.join(audioDir, `message_${index}.json`) });
        } catch (error) {
          console.error(`Error while getting phonemes for message ${index}:`, error);
        }
      })
    );

    return messages;
  } finally {
    await fs.promises.rm(audioDir, { recursive: true, force: true });
  }
};

export { lipSync };
