import path from "path";
import { execCommand } from "../utils/files.mjs";

const getPhonemes = async ({ message, audioDir = "audios", runCommand = execCommand }) => {
  try {
    const time = new Date().getTime();
    const mp3Path = path.join(audioDir, `message_${message}.mp3`);
    const wavPath = path.join(audioDir, `message_${message}.wav`);
    const transcriptPath = path.join(audioDir, `message_${message}.json`);

    console.log(`Starting conversion for message ${message}`);
    await runCommand({ command: `ffmpeg -y -i "${mp3Path}" "${wavPath}"` });
    console.log(`Conversion done in ${new Date().getTime() - time}ms`);
    await runCommand({
      command: `./bin/rhubarb -f json -o "${transcriptPath}" "${wavPath}" -r phonetic`,
    });
    // -r phonetic is faster but less accurate
    console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error(`Error while getting phonemes for message ${message}:`, error);
  }
};

export { getPhonemes };
