export class DailyService {
    constructor(dailyStore) { this.dailyStore = dailyStore; }
    getDaily() { return this.dailyStore.getDaily(); }
}
