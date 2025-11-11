export let mode = 'offline';
export let predictRender = false

export function setMode(modeName){
    if(modeName !== 'offline' && modeName !== 'online'){
        throw new Error('mode selection error occured');
    }
    mode = modeName;
}

export function setPredictRender(b){
    predictRender = b;
}