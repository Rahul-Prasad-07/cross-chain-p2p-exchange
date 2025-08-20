import express from "express";
import cors from "cors";
import { API_PORT, LOG_LEVEL } from "./config.js";
import { listOffers, getOffer, listEvents, listTxs } from "./db.js";
import { logger } from "./logger.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

/* Offers: /offers?limit=&offset= */
app.get("/offers", async (req, res) => {
    try {
        const limit = Math.min(1000, Number(req.query.limit || 100));
        const offset = Number(req.query.offset || 0);
        const rows = await listOffers(limit, offset);
        res.json(rows);
    } catch (e) {
        logger("error", LOG_LEVEL, "API /offers error", e);
        res.status(500).json({ error: String(e) });
    }
});

app.get("/offers/:offerPda", async (req, res) => {
    try {
        const row = await getOffer(req.params.offerPda);
        if (!row) return res.status(404).json({ error: "not found" });
        res.json(row);
    } catch (e) {
        logger("error", LOG_LEVEL, "API /offers/:id error", e);
        res.status(500).json({ error: String(e) });
    }
});

/* Events: /events?offerPda=&limit=&offset= */
app.get("/events", async (req, res) => {
    try {
        const limit = Math.min(1000, Number(req.query.limit || 100));
        const offset = Number(req.query.offset || 0);
        const offerPda = typeof req.query.offerPda === "string" ? req.query.offerPda : undefined;
        const rows = await listEvents(offerPda, limit, offset);
        res.json(rows);
    } catch (e) {
        logger("error", LOG_LEVEL, "API /events error", e);
        res.status(500).json({ error: String(e) });
    }
});

/* Tx list */
app.get("/txs", async (req, res) => {
    try {
        const limit = Math.min(1000, Number(req.query.limit || 100));
        const offset = Number(req.query.offset || 0);
        const rows = await listTxs(limit, offset);
        res.json(rows);
    } catch (e) {
        logger("error", LOG_LEVEL, "API /txs error", e);
        res.status(500).json({ error: String(e) });
    }
});

export function startApiServer() {
    app.listen(API_PORT, () => {
        logger("info", LOG_LEVEL, `API server listening on http://0.0.0.0:${API_PORT}`);
    });
    return app;
}
