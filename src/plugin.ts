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
} from "@skeldjs/hindenburg";

class MapLoadedRPC extends BaseRpcMessage {
    static tag = 233 as const; // The hazel message tag.
    tag = 233 as const;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static Deserialize(reader: HazelReader): MapLoadedRPC {
        return new MapLoadedRPC();
    }
}

@HindenburgPlugin("hbplugin-apollo-support")
export class ApolloSupportPlugin extends WorkerPlugin {
    isloaded = new Set<number>();
    constructor(worker: Worker, config: any) {
        super(worker, config);
    }
    @MessageHandler(MapLoadedRPC)
    handler(message: MapLoadedRPC, ctx: PacketContext) {
        this.logger.info("maploaded");
        if (ctx.sender.room) this.isloaded.add(ctx.sender.room.code);
    }

    @EventListener("room.beforedestroy")
    onDestroy(ev: RoomBeforeDestroyEvent) {
        this.isloaded.delete(ev.room.code);
    }

    @EventListener("room.endgameintent")
    endGameIntent(endGameIntent: RoomEndGameIntentEvent<Room>) {
        if (!this.isloaded.has(endGameIntent.room.code)) endGameIntent.cancel();
    }
}
