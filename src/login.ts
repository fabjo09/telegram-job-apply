import { loadTelegramLoginConfig } from "./config.js";
import { logInAndPrintSession } from "./telegram.js";

await logInAndPrintSession(loadTelegramLoginConfig());
