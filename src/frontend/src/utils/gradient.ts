export const pickGradient = (title: string = '', gradients: readonly string[]): string => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
        hash = hash & hash;
    }
    return gradients[Math.abs(hash) % gradients.length];
};
