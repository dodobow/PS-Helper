function calculateTierInfo(tierNum) {
    const TIER_COLORS = [
        '#000000',
        '#ad5600', '#b85b00', '#c46100', '#cf6700', '#db6c00',
        '#435f7a', '#476582', '#4b6b8a', '#507292', '#54789a',
        '#ec9a00', '#fba400', '#ffae00', '#ffb800', '#ffc300',
        '#25d69b', '#27e2a4', '#28edac', '#2af8b4', '#2cffbc',
        '#00b4fc', '#00c0ff', '#00ccff', '#00d8ff', '#00e4ff',
        '#cc004e', '#dd0054', '#ee005b', '#ff0062', '#ff0068',
        '#AC9FFF'
    ];
    let name = ''
    if (tierNum == 0) {
        name = 'Unrated';
    } else if (tierNum == 31) {
        name = 'Master';
    } else {
        name = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby'][Math.floor((tierNum - 1) / 5)] + ' ' + ['V', 'IV', 'III', 'II', 'I'][(tierNum + 4) % 5];
    }
    return {name, color : TIER_COLORS[tierNum]};
}

function calculateRecommendTier(userTier, userGoal, userDiff) {
    let lo = Math.max(Math.floor(userTier / 2) + userDiff, 1);
    let hi = lo + Math.floor(userTier / 5) + 2;
    if (userGoal) {
        if (userGoal === 'beginner') {
            lo = Math.min(lo, 1);
            hi = Math.min(hi, 10);
        } else if (userGoal === 'job') {
            lo = Math.min(lo, 8);
            hi = Math.min(hi, 15);
        }
    }
    return {lo : lo, hi : hi};
}