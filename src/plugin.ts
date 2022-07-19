import {
    HindenburgPlugin,
    EventListener,
    Room,
    WorkerPlugin,
    Worker,
    MessageHandler,
    PacketContext,
    BaseRpcMessage,
    HazelReader,
    RoomEndGameIntentEvent,
    RoomBeforeDestroyEvent,
    RegisterMessage,
    PlayerInfo,
    RoomGameEndEvent,
} from "@skeldjs/hindenburg";

class MapLoadedRPC extends BaseRpcMessage {
    static tag = 233 as const; // The hazel message tag.
    tag = 233 as const;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static Deserialize(reader: HazelReader): MapLoadedRPC {
        return new MapLoadedRPC();
    }
}

@RegisterMessage(MapLoadedRPC)
@HindenburgPlugin("hbplugin-apollo-support")
export class ApolloSupportPlugin extends WorkerPlugin {
    isloaded = new Map<number, Set<number>>();
    constructor(worker: Worker, config: any) {
        super(worker, config);
    }
    @MessageHandler(MapLoadedRPC)
    handler(message: MapLoadedRPC, ctx: PacketContext) {
        this.logger.info("maploaded");
        if (ctx.sender.room) {
            if (!this.isloaded.has(ctx.sender.room.code))
                this.isloaded.set(ctx.sender.room.code, new Set());
            this.isloaded
                .get(ctx.sender.room.code)
                ?.add(ctx.sender.getPlayer()!.clientId);
        }
    }

    @EventListener("room.beforedestroy")
    @EventListener("room.gameend")
    onDestroy(ev: RoomBeforeDestroyEvent | RoomGameEndEvent) {
        this.isloaded.delete(ev.room.code);
    }

    hasAllPlayers(set: Set<number>, players: PlayerInfo[]) {
        let hasAll = true;
        for (const player of players) {
            if (player.isDisconnected) continue;
            hasAll = hasAll && set.has(player.playerId);
        }
        return hasAll;
    }

    @EventListener("room.endgameintent")
    endGameIntent(endGameIntent: RoomEndGameIntentEvent<Room>) {
        if (
            !this.isloaded.has(endGameIntent.room.code) ||
            !this.hasAllPlayers(
                this.isloaded.get(endGameIntent.room.code)!,
                [...endGameIntent.room.players.values()].map(
                    (a) => a.playerInfo!
                )
            )
        )
            endGameIntent.cancel();
    }
}
