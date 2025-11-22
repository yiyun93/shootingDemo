export default function getBlinkingAlpha(timestamp, blinkPeriod = 1500) {
    const timeInCycle = timestamp % blinkPeriod;
    // 시간에 따른 각도 계산 (0부터 2*PI까지 변하도록)
    const angle = (timeInCycle / blinkPeriod) * 2 * Math.PI;
    const alpha = (Math.sin(angle) + 1.0) / 2.0;

    return alpha;
}