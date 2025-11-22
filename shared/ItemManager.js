import { ITEM_DROP_PERIOD, ITEM_DROP_PROB, ITEM_FALL_SPEED, MAX_ITEMS } from "./constants";
import { isColliding } from "./physics";
import getBlinkingAlpha from "../client/src/getBlinkingAlpha";

const itemConfigs = {
    Revolver: {
        content: 'Revolver',
        width: 25,
        height: 20,
        color: "#d8b25fff"
    },
    Smg: {
        content: 'Smg',
        width: 25,
        height: 35,
        color: "#7e7373ff"
    },
    Snipergun: {
        content: 'Snipergun',
        width: 45,
        height: 30,
        color: "#a252c2ff"
    }
};

export default class ItemManager{
    static dropProbTable = {
        Revolver: 1,
        Smg: 0.6,
        Snipergun: 0.2
    }

    static dropCount = ITEM_DROP_PERIOD;
    static items = [];

    static drop(deltaTime, canvasWidth){
        ItemManager.dropCount -= deltaTime;
        if(ItemManager.dropCount <= 0){
            ItemManager.dropCount = ITEM_DROP_PERIOD;
            if(ItemManager.items.length >= MAX_ITEMS) return;

            let X = Math.random();
            if(X > ITEM_DROP_PROB) return;

            X = Math.random();
            switch (true){
                case X<ItemManager.dropProbTable.Snipergun:
                    ItemManager.items.push(new Item(itemConfigs['Snipergun'], canvasWidth));
                    break;
                case X<ItemManager.dropProbTable.Smg:
                    ItemManager.items.push(new Item(itemConfigs['Smg'], canvasWidth));
                    break;
                case X<ItemManager.dropProbTable.Revolver:
                default:
                    ItemManager.items.push(new Item(itemConfigs['Revolver'], canvasWidth));
                    break;
            }
        }
    }

    static update(deltaTime, timestamp, players, canvasWidth, canvasHeight, platforms, ctx){
        ItemManager.drop(deltaTime, canvasWidth);

        ItemManager.items = ItemManager.items.filter( item => {
            item.draw(ctx, timestamp);
            return (item.judgeContact(players) && item.move(deltaTime, platforms, canvasHeight));
        })
    }
}

class Item{
    constructor(config, canvasWidth){
        Object.assign(this, config);
        this.x = Math.round(Math.random() * (canvasWidth - this.width));
        this.y = 0;
        this.stop = false;
    }

    // item 낙하
    move(deltaTime, platforms, canvasHeight){
        if(this.stop) return true;

        this.y += ITEM_FALL_SPEED * deltaTime;
        if(this.y > canvasHeight) return false;

        for(const platform of platforms){
            if(isColliding(platform, this)) this.stop = true;
        }

        return true;
    }

    // 플레이어 충돌 판정
    judgeContact(players){
            for(const player of players){
                if(player.isAlive && isColliding(this, player)){
                    player.getItem(this.content);
                    return false;
                }
            }
        return true;
    }

    draw(ctx, timestamp){
        ctx.globalAlpha = getBlinkingAlpha(timestamp, 800);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
    }
}