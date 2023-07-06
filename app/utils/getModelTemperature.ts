
export const getModelTemperature = (botCreativity: string = 'conservative') => {
    if (botCreativity === "restricted") return 0
    else if (botCreativity === "conservative") return 0.4
    else if (botCreativity === 'creative') return 1

    // default
    return 0
}