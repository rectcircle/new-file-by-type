import { getOutputChannel } from "./vscode";
import * as moment from "moment";

export const Logger = {
	log(level: "INFO" | "ERROR", ...message: string[]) {
		getOutputChannel().appendLine(`[${level} ${moment().format()}] ${message.join(' ')}`);
	},
	info(... message: string[]) {
		this.log("INFO", ...message);
	},
	error(...message: string[]) {
		this.log("ERROR", ...message);
	},
};