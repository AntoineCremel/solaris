const Agenda = require('agenda');
const config = require('../config');
const mongooseLoader = require('../loaders/mongoose');
const containerLoader = require('../loaders/container');

let mongo;

async function startup() {
    const container = containerLoader(null);

    mongo = await mongooseLoader();
    console.log('MongoDB Intialized');

    const gameTickJob = require('./gameTick')(container);
    const officialGamesCheckJob = require('./officialGamesCheck')(container);
    const cleanupOldGamesJob = require('./cleanupOldGames')(container);

    // Set up the agenda instance.
    const agendajs = new Agenda()
        .database(config.connectionString)
        .processEvery('10 seconds')
        .maxConcurrency(20);

    await agendajs._ready;

    // ------------------------------
    // Register jobs

    // Game tick
    agendajs.define('game-tick', {
        priority: 'high', concurrency: 10
    },
    gameTickJob.handler); // reference to the handler, but not executing it! 

    // New player game check
    agendajs.define('new-player-game-check', {
        priority: 'high', concurrency: 1
    },
    officialGamesCheckJob.handler);

    // Cleanup old games
    // agendajs.define('cleanup-old-games', {
    //     priority: 'high', concurrency: 1
    // },
    // cleanupOldGamesJob.handler);

    // ...

    // ------------------------------

    agendajs.start();

    // Start server jobs
    agendajs.every('10 seconds', 'game-tick');
    agendajs.every('5 minutes', 'new-player-game-check');
}

process.on('SIGINT', async () => {
    console.log('Shutting down...');

    await mongo.disconnect();

    console.log('Shutdown complete.');

    process.exit();
});

startup().then(() => {
    console.log('Jobs started.');
});
