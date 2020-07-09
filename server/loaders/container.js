const bcrypt = require('bcrypt');

const GameModel = require('../models/Game');
const UserModel = require('../models/User');
const HistoryModel = require('../models/History');
const EventModel = require('../models/Event');

const AuthService = require('../services/auth');
const BroadcastService = require('../services/broadcast');
const CarrierService = require('../services/carrier');
const CombatService = require('../services/combat');
const DistanceService = require('../services/distance');
const EmailService = require('../services/email');
const EventService = require('../services/event');
const LeaderboardService = require('../services/leaderboard');
const GameService = require('../services/game');
const GameCreateService = require('../services/gameCreate');
const GameGalaxyService = require('../services/gameGalaxy');
const GameListService = require('../services/gameList');
const GameTickService = require('../services/gameTick');
const MapService = require('../services/map');
const PlayerService = require('../services/player');
const RandomService = require('../services/random');
const ResearchService = require('../services/research');
const StarService = require('../services/star');
const StarDistanceService = require('../services/starDistance');
const NameService = require('../services/name');
const StarUpgradeService = require('../services/starUpgrade');
const TechnologyService = require('../services/technology');
const TimeService = require('../services/time');
const TradeService = require('../services/trade');
const WaypointService = require('../services/waypoint');
const MessageService = require('../services/message');
const ShipTransferService = require('../services/shipTransfer');
const UserService = require('../services/user');
const HistoryService = require('../services/history');

const StandardMapService = require('../services/maps/standard');
const CircularMapService = require('../services/maps/circular');

const config = require('../config');
const gameNames = require('../config/game/gameNames');
const starNames = require('../config/game/starNames');

module.exports = (io) => {
    // Poor man's dependency injection.

    const authService = new AuthService(bcrypt, UserModel);
    const userService = new UserService(bcrypt, UserModel);

    const broadcastService = new BroadcastService(io);
    const eventService = new EventService(EventModel);
    const carrierService = new CarrierService();
    const combatService = new CombatService();
    const distanceService = new DistanceService();
    const emailService = new EmailService(config);
    const randomService = new RandomService();
    const technologyService = new TechnologyService();
    const timeService = new TimeService();
    const gameService = new GameService(GameModel, userService, eventService);
    const gameListService = new GameListService(GameModel);
    const nameService = new NameService(gameNames, starNames, randomService);
    const starDistanceService = new StarDistanceService(distanceService);
    const starService = new StarService(randomService, nameService, distanceService, starDistanceService, eventService);
    const standardMapService = new StandardMapService(randomService, starService, starDistanceService);
    const circularMapService = new CircularMapService(randomService, starService, starDistanceService, distanceService);
    // const mapService = new MapService(randomService, starService, starDistanceService, nameService, standardMapService); // TODO: Needs to be refactored to get the required service from a game setting.
    const mapService = new MapService(randomService, starService, starDistanceService, nameService, circularMapService);
    const playerService = new PlayerService(randomService, mapService, starService, carrierService, starDistanceService, technologyService);
    const leaderboardService = new LeaderboardService(UserModel, userService, playerService);
    const researchService = new ResearchService(technologyService, randomService, playerService, timeService, eventService, userService);
    const tradeService = new TradeService(userService, playerService, eventService);
    const waypointService = new WaypointService(carrierService, starService, distanceService, starDistanceService);
    const gameCreateService = new GameCreateService(GameModel, nameService, mapService, playerService);
    const starUpgradeService = new StarUpgradeService(starService, carrierService, eventService, userService);
    const gameGalaxyService = new GameGalaxyService(mapService, playerService, starService, distanceService, starDistanceService, starUpgradeService, carrierService, waypointService, researchService, timeService);
    const historyService = new HistoryService(HistoryModel, playerService);
    const gameTickService = new GameTickService(eventService, broadcastService, distanceService, starService, carrierService, researchService, playerService, historyService, waypointService, combatService, leaderboardService, userService);
    const messageService = new MessageService();
    const shipTransferService = new ShipTransferService(carrierService, starService);

    return {
        authService,
        broadcastService,
        carrierService,
        combatService,
        distanceService,
        emailService,
        eventService,
        leaderboardService,
        gameService,
        gameCreateService,
        gameGalaxyService,
        gameListService,
        gameTickService,
        mapService,
        playerService,
        randomService,
        researchService,
        starService,
        starDistanceService,
        nameService,
        starUpgradeService,
        technologyService,
        tradeService,
        userService,
        waypointService,
        shipTransferService,
        messageService,
        historyService,
    };
};
