const DAY_MS = 24 * 60 * 60 * 1_000;
const WORDS = ['serendipity', 'luminous', 'sonder', 'ephemeral', 'verdant', 'mellifluous', 'resilient', 'halcyon', 'petrichor', 'wanderlust', 'solstice', 'rhapsody'];

export class DailyStore {
    constructor() {
        this.cached = null;
    }

    async getDaily() {
        const day = new Date().toISOString().slice(0, 10);
        if (this.cached?.day === day) return this.cached.data;

        const word = WORDS[Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS) % WORDS.length];
        const [dogResult, quoteResult, definitionResult] = await Promise.allSettled([
            this.fetchJson('https://dog.ceo/api/breeds/image/random'),
            this.fetchJson('https://zenquotes.io/api/today'),
            this.fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`),
        ]);
        const dog = dogResult.status === 'fulfilled' ? dogResult.value : null;
        const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
        const definition = definitionResult.status === 'fulfilled' ? definitionResult.value : null;
        if (dogResult.status === 'rejected') console.error('Puppy of the Day unavailable:', dogResult.reason);
        if (quoteResult.status === 'rejected') console.error('Quote of the Day unavailable:', quoteResult.reason);
        if (definitionResult.status === 'rejected') console.error('Word definition unavailable:', definitionResult.reason);
        const entry = definition?.[0];
        const meaning = entry?.meanings?.[0];
        const data = {
            puppy: { image: dog?.message || null },
            quote: { text: quote?.[0]?.q || 'Stay curious, keep learning, and make room for joy.', author: quote?.[0]?.a || 'Daily Delights' },
            word: { word: entry?.word || word, phonetic: entry?.phonetic || '', partOfSpeech: meaning?.partOfSpeech || '', definition: meaning?.definitions?.[0]?.definition || 'A word selected for today.' },
        };
        this.cached = { day, data };
        return data;
    }

    async fetchJson(url) {
        const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!response.ok) throw new Error(`Daily API returned ${response.status}`);
        return response.json();
    }
}
