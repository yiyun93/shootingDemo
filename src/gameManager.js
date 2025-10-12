export function killPlayer(player, timestamp){
    player.isAlive = false;
    player.deadTime = timestamp;
}