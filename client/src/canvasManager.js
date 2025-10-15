let canvas;
let ctx;
let wrapperElement;

/**
 * 캔버스 관리 모듈을 초기화하고 부모 요소를 설정합니다.
 * @param {HTMLElement} wrapper - 캔버스를 삽입할 부모 DOM 요소
 */
export function initializeCanvasManager(wrapper) {
    wrapperElement = wrapper;
}

/**
 * 기존 캔버스를 제거하고 새로운 크기로 캔버스를 생성합니다.
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}} 새 캔버스와 컨텍스트 객체를 반환
 */
export function recreateCanvas(map) {
    if (!wrapperElement) {
        throw new Error("Canvas Manager가 초기화되지 않았습니다. initializeCanvasManager를 먼저 호출하세요.");
    }
    
    // 1. 기존 캔버스 제거
    if (canvas) {
        wrapperElement.removeChild(canvas); 
    }
    
    // 2. 새로운 캔버스 생성 및 속성 설정
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'GameCanvas';
    newCanvas.width = map.width;
    newCanvas.height = map.height;

    // 3. 변수에 새로운 요소 재할당
    canvas = newCanvas; 
    ctx = canvas.getContext('2d');
    
    // 4. 새로운 캔버스를 DOM에 추가
    wrapperElement.appendChild(canvas);

    // 긴 맵은 margin-bottom 제거
    if(map.height >= 750) wrapperElement.style.marginBottom = '0%';
    
    // 5. 게임 로직에서 사용할 수 있도록 캔버스와 컨텍스트를 반환
    return { canvas, ctx };
}