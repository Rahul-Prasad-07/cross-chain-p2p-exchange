export function logger(level: "debug" | "info" | "warn" | "error", LOG_LEVEL: "debug" | "info" | "warn" | "error", ...args: any[]) {
    const order: any = { debug: 0, info: 1, warn: 2, error: 3 };
    if (order[level] < order[LOG_LEVEL]) return;
    const prefix = `[${level}]`;
    if (level === "error") console.error(prefix, ...args);
    else console.log(prefix, ...args);
}
