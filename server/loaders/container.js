const bcrypt = require('bcrypt');

const GameModel = require('../models/Game');
const UserModel = require('../models/User');
const HistoryModel = require('../models/History');

const AuthService = require('../services/auth');
const CarrierService = require('../services/carrier');
const DistanceService = require('../services/distance');
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
const StarNameService = require('../services/starName');
const StarUpgradeService = require('../services/starUpgrade');
const TimeService = require('../services/time');
const TradeService = require('../services/trade');
const WaypointService = require('../services/waypoint');
const MessageService = require('../services/message');
const ShipTransferService = require('../services/shipTransfer');
const UserService = require('../services/user');
const HistoryService = require('../services/history');

const StandardMapService = require('../services/maps/standard');
const CircularMapService = require('../services/maps/circular');

const starNames = require('../config/game/starNames');

module.exports = (io) => {
    // Poor man's dependency injection.

    const authService = new AuthService(bcrypt, UserModel);
    const userService = new UserService(bcrypt, UserModel);

    const carrierService = new CarrierService();
    const distanceService = new DistanceService();
    const randomService = new RandomService();
    const timeService = new TimeService();
    const gameService = new GameService(GameModel, userService);
    const gameListService = new GameListService(GameModel);
    const starNameService = new StarNameService(starNames, randomService);
    const starDistanceService = new StarDistanceService(distanceService);
    const starService = new StarService(randomService, starNameService, distanceService, starDistanceService);
    const standardMapService = new StandardMapService(randomService, starService, starDistanceService);
    const circularMapService = new CircularMapService(randomService, starService, starDistanceService, distanceService);
    // const mapService = new MapService(randomService, starService, starDistanceService, starNameService, standardMapService); // TODO: Needs to be refactored to get the required service from a game setting.
    const mapService = new MapService(randomService, starService, starDistanceService, starNameService, circularMapService);
    const playerService = new PlayerService(randomService, mapService, starService, carrierService, starDistanceService);
    const researchService = new ResearchService(randomService, playerService, timeService);
    const tradeService = new TradeService(userService, playerService);
    const waypointService = new WaypointService(carrierService, playerService, starService, distanceService, starDistanceService);
    const gameCreateService = new GameCreateService(GameModel, mapService, playerService);
    const starUpgradeService = new StarUpgradeService(starService, carrierService, playerService);
    const gameGalaxyService = new GameGalaxyService(mapService, playerService, starService, distanceService, starDistanceService, starUpgradeService, carrierService, waypointService, researchService, timeService);
    const historyService = new HistoryService(HistoryModel, playerService);
    const gameTickService = new GameTickService(io, distanceService, starService, researchService, playerService, historyService, waypointService);
    const messageService = new MessageService();
    const shipTransferService = new ShipTransferService(carrierService, starService, playerService);

    return {
        authService,
        carrierService,
        distanceService,
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
        starNameService,
        starUpgradeService,
        tradeService,
        userService,
        waypointService,
        shipTransferService,
        messageService,
        historyService,
    };
};
