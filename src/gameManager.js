export function killPlayer(player){
    player.isAlive = false;
    player.deadTime = timestamp;
}